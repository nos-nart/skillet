import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import {
  ensureDir,
  readSkillMd as nativeReadSkillMd,
  scanSkillsDir,
  symlink,
  unlink,
  validateSafeSlug,
  writeTextFile,
} from "@skillet/skills-fs";
import { FsError, InvalidSlugError } from "./errors";
import {
  fetchLatestCommit,
  fetchSkillMd,
  loadSkillsLock,
  parseGitHubRepo,
  saveSkillsLock,
  type FetchFn,
} from "./github";
import { storageJsonStore, type JsonStore } from "./workspaces";

// Pure ports of the Deno backend (`src/backend/*.ts`) for the macOS app:
// no Deno APIs, no new dependencies. Filesystem IO goes through the
// Task 2 `skills-fs` TurboModule, whose `scanSkillsDir` expands `~` natively
// (RNSkillsFs.mm `stringByExpandingTildeInPath`), so callers may pass
// tilde-prefixed global dirs. `symlink`/`unlink` do NOT expand tilde —
// toggle targets must be absolute (file-dialog returns absolute paths).

export type AgentId =
  | "claude-code"
  | "cursor"
  | "gemini"
  | "generic"
  | "antigravity"
  | "windsurf"
  | "opencode"
  | "codex"
  | "copilot";

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  trigger?: string;
  tools?: string[];
  agents?: AgentId[];
  license?: string;
  sourceUrl?: string;
}

export interface ParsedSkillDoc {
  metadata: SkillMetadata;
  body: string;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  packageName: string;
  scope: "global" | "project";
  agent: AgentId;
  path: string;
  skillMdPath: string;
  metadata: SkillMetadata;
  rawMarkdown: string;
  isSymlink: boolean;
  targetPath?: string;
  updateAvailable?: boolean;
  provider?: "github" | "local";
  sourceUrl?: string;
  enabledInWorkspaces?: string[];
}

export interface ToggleSkillRequest {
  skillSlug: string;
  sourcePath: string;
  workspacePath: string;
  enable: boolean;
}

export interface SkillsFs {
  scanSkillsDir(dir: string): Promise<string[]>;
  readSkillMd(path: string): Promise<string>;
  symlink(source: string, target: string): Promise<boolean>;
  unlink(target: string): Promise<boolean>;
}

// Narrow install surface: the Task 2 `skills-fs` module grew `ensureDir` +
// `writeTextFile` for Task 7. Kept separate from `SkillsFs` so existing fakes
// (scan/read/symlink/unlink only) keep typechecking untouched.
export interface SkillWriter {
  ensureDir(path: string): Promise<boolean>;
  writeTextFile(path: string, contents: string): Promise<boolean>;
}

const defaultSkillsFs: SkillsFs = { scanSkillsDir, readSkillMd: nativeReadSkillMd, symlink, unlink };
const defaultSkillWriter: SkillWriter = { ensureDir, writeTextFile };

// Global skill dirs per agent, verbatim from `src/backend/agents.ts`
// (`globalDirName`). `~/.skills` first: it is the canonical universal home.
const AGENT_SKILL_DIRS: ReadonlyArray<{ agent: AgentId; dir: string }> = [
  { agent: "generic", dir: ".skills" },
  { agent: "claude-code", dir: ".claude/skills" },
  { agent: "cursor", dir: ".cursor/skills" },
  { agent: "gemini", dir: ".gemini/config/skills" },
  { agent: "antigravity", dir: ".gemini/config/skills" },
  { agent: "windsurf", dir: ".codeium/windsurf/skills" },
  { agent: "copilot", dir: ".github/skills" },
  { agent: "opencode", dir: ".opencode/skills" },
];

export const DEFAULT_SKILL_DIRS: readonly string[] = AGENT_SKILL_DIRS.map(
  ({ dir }) => `~/${dir}`,
);

// Workspace-local skills always live under the universal `.skills` dir
// (verbatim `getAgentRelPath` from `src/backend/agents.ts`).
const WORKSPACE_SKILLS_REL = ".skills";

// Small built-in frontmatter field parser replacing `npm:yaml` (no new deps).
// Handles `key: value` scalars (quotes stripped) plus `tools`/`agents` as
// inline `[a, b]` / comma lists or `- item` block sequences.
function parseFrontmatterFields(block: string): Record<string, string | string[]> {
  const fields: Record<string, string | string[]> = {};
  let listKey: string | null = null;
  for (const line of block.split(/\r?\n/)) {
    const item = line.match(/^\s*-\s+(.+)$/);
    if (item && listKey) {
      const prev = fields[listKey];
      const rest = item[1].trim();
      fields[listKey] = Array.isArray(prev) ? [...prev, rest] : [rest];
      continue;
    }
    const entry = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    listKey = null;
    if (!entry) continue;
    const key = entry[1].toLowerCase();
    let value = entry[2].trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    } else if (value.length >= 2 && value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1);
    }
    if ((key === "tools" || key === "agents") && value !== "") {
      const inline = value.replace(/^\[|\]$/g, "");
      fields[key] = inline.split(",").map((s) => s.trim()).filter((s) => s !== "");
    } else {
      fields[key] = value;
    }
    if ((key === "tools" || key === "agents") && value === "") {
      fields[key] = [];
      listKey = key;
    }
  }
  return fields;
}

function fieldAsString(fields: Record<string, string | string[]>, key: string): string | undefined {
  const value = fields[key];
  return typeof value === "string" && value !== "" ? value : undefined;
}

export function parseSkillMd(content: string): ParsedSkillDoc {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { metadata: { name: "Unnamed Skill", description: "" }, body: content };
  let fields: Record<string, string | string[]>;
  try {
    fields = parseFrontmatterFields(m[1]);
  } catch {
    // Parity with src/backend/scanner.ts: unparseable frontmatter leaves body as full content.
    return { metadata: { name: "Unnamed Skill", description: "" }, body: content };
  }
  if (Object.keys(fields).length === 0) {
    // No `key: value` fields recognized → treat as unparseable (parseYaml would
    // throw or return a non-object), so body stays the full input.
    return { metadata: { name: "Unnamed Skill", description: "" }, body: content };
  }
  const rawName = fieldAsString(fields, "name");
  const name = rawName ?? "Unnamed Skill";
  return {
    metadata: {
      name,
      description: fieldAsString(fields, "description") ?? "",
      author: fieldAsString(fields, "author"),
      version: fieldAsString(fields, "version"),
      trigger:
        fieldAsString(fields, "trigger") ??
        `/${(rawName ?? "skill").toLowerCase().replace(/\s+/g, "-")}`,
      // SAFETY: tools entries are collected as strings by parseFrontmatterFields
      tools: (fields["tools"] as string[] | undefined) ?? [],
      // SAFETY: frontmatter agent entries are validated non-empty strings of the AgentId domain
      agents: ((fields["agents"] as string[] | undefined) ?? []) as AgentId[],
      license: fieldAsString(fields, "license"),
      sourceUrl: fieldAsString(fields, "source_url"),
    },
    body: m[2].trim(),
  };
}

// Strips trailing slashes so workspace paths compare/join consistently.
export function normalizeWs(p: string): string {
  return p.replace(/\/+$/, "");
}

// Verbatim port of `resolveSafeTarget` from `src/backend/symlinker.ts`.
export function resolveSkillTarget(workspacePath: string, skillSlug: string): string | null {
  if (!validateSafeSlug(skillSlug)) {
    return null;
  }
  const normalizedWs = normalizeWs(workspacePath);
  // `symlink`/`unlink` do NOT expand `~` natively (absolute-only contract),
  // and an empty workspace would anchor the target at the filesystem root —
  // reject both before joining.
  if (normalizedWs === "" || normalizedWs.startsWith("~")) {
    return null;
  }
  const target = `${normalizedWs}/${WORKSPACE_SKILLS_REL}/${skillSlug}`;

  // Ensure resolved path doesn't escape workspace (segment-aware so `/ws`
  // never matches a sibling like `/ws2/...`). Defense-in-depth: the target is
  // constructed from `normalizedWs` below, so this holds by construction —
  // the live protection is `validateSafeSlug` above plus native re-validation.
  if (!target.startsWith(`${normalizedWs}/`)) {
    return null;
  }
  return target;
}

interface FoundSkillDoc {
  dir: string;
  rel: string;
  agent: AgentId;
  content: string;
}

// Recursive walk mirroring `scanDirectoryForSkills` (depth-bounded, skips
// unreadable dirs). Native scan is single-level, so one extra level covers
// `~/.skills/<owner>/<slug>` and two cover `<owner>/<repo>/<slug>`.
async function walkSkillsDir(
  fs: SkillsFs,
  dir: string,
  rel: string,
  agent: AgentId,
  depth: number,
  out: FoundSkillDoc[],
): Promise<void> {
  if (depth > 3) return;
  let entries: string[];
  try {
    entries = await fs.scanSkillsDir(dir);
  } catch {
    return;
  }
  for (const full of entries) {
    const base = full.split("/").pop() ?? full;
    const nextRel = rel === "" ? base : `${rel}/${base}`;
    try {
      const content = await fs.readSkillMd(`${full}/SKILL.md`);
      out.push({ dir: full, rel: nextRel, agent, content });
    } catch {
      // No SKILL.md here, recurse deeper
      await walkSkillsDir(fs, full, nextRel, agent, depth + 1, out);
    }
  }
}

function agentForDir(dir: string): AgentId {
  const found = AGENT_SKILL_DIRS.find(({ dir: d }) => dir === `~/${d}` || dir.endsWith(`/${d}`));
  return found?.agent ?? "generic";
}

// Ports `GET /api/skills` assembly (`api.ts`) over the native scanner:
// per-dir walk, then by-slug dedup preferring non-symlinks. The by-realPath
// pass is skipped — Task 2's surface has no realPath/lstat, so `isSymlink`
// is always false (documented gap, same as the deferred scan-order note).
export async function getSkills(
  dirs: readonly string[] = DEFAULT_SKILL_DIRS,
  fs: SkillsFs = defaultSkillsFs,
): Promise<Skill[]> {
  const perDirFound = await Promise.all(
    dirs.map(async (dir) => {
      const dirFound: FoundSkillDoc[] = [];
      await walkSkillsDir(fs, dir, "", agentForDir(dir), 0, dirFound);
      return dirFound;
    }),
  );
  const found: FoundSkillDoc[] = perDirFound.flat();

  const rawSkills: Skill[] = found.map(({ dir, rel, agent, content }) => {
    const { metadata, body } = parseSkillMd(content);
    // For GitHub installed skills, the rel might be owner/slug or owner/repo/slug
    const parts = rel.split("/");
    const isGithub = parts.length > 1 || (metadata.sourceUrl?.includes("github.com") ?? false);
    const packageName =
      parts.length > 1 ? parts[0] + (parts.length > 2 ? `/${parts[1]}` : "") : "Global skills";
    const slug = parts[parts.length - 1];
    return {
      id: rel,
      name: metadata.name,
      slug,
      packageName,
      scope: "global" as const,
      agent,
      path: dir,
      skillMdPath: `${dir}/SKILL.md`,
      metadata,
      rawMarkdown: body,
      isSymlink: false,
      provider: isGithub ? ("github" as const) : ("local" as const),
      sourceUrl: metadata.sourceUrl ?? (parts.length > 1 ? `https://github.com/${parts[0]}` : undefined),
    };
  });

  // Dedup by slug (same skill in multiple agent dirs)
  const bySlug = new Map<string, Skill>();
  for (const skill of rawSkills) {
    const existing = bySlug.get(skill.slug);
    if (!existing || (existing.isSymlink && !skill.isSymlink)) {
      bySlug.set(skill.slug, skill);
    }
  }
  return [...bySlug.values()];
}

// No lstat on the Task 2 surface: enabled = slug present under the
// workspace's universal `.skills` dir (deviation from `isSkillEnabledInWorkspace`).
export async function isSkillEnabled(
  skillSlug: string,
  workspacePath: string,
  fs: SkillsFs = defaultSkillsFs,
): Promise<boolean> {
  if (!validateSafeSlug(skillSlug)) return false;
  const normalizedWs = normalizeWs(workspacePath);
  let entries: string[];
  try {
    entries = await fs.scanSkillsDir(`${normalizedWs}/${WORKSPACE_SKILLS_REL}`);
  } catch {
    return false;
  }
  return entries.some((full) => (full.split("/").pop() ?? full) === skillSlug.trim());
}

export async function toggleSkill(
  req: ToggleSkillRequest,
  fs: SkillsFs = defaultSkillsFs,
): Promise<boolean> {
  const target = resolveSkillTarget(req.workspacePath, req.skillSlug);
  if (!target) {
    if (req.enable) {
      console.error(`Invalid skill slug or path traversal attempt: ${req.skillSlug}`);
    }
    return false;
  }
  try {
    if (req.enable) {
      return await fs.symlink(req.sourcePath, target);
    }
    return await fs.unlink(target);
  } catch {
    return false;
  }
}

export interface DownloadSkillOptions {
  source: string; // e.g. "anthropics/skills/skills/eli5" or a GitHub/skills.sh URL
  skillName?: string;
  targetDir?: string;
  token?: string;
}

export type DownloadSkillResult = { ok: true; path: string } | { ok: false; error: string };

export interface DownloadSkillDeps {
  writer?: SkillWriter;
  fetchImpl?: FetchFn;
  lockStore?: JsonStore;
}

// Agent-aware global dir heuristic, verbatim from `src/backend/installer.ts`
// (`downloadSkillFromGitHub`). The universal `~/.skills` home stays default;
// the writer expands `~` natively (same contract as scan/read).
// Ordered keyword rules (first match wins) resolve to an agent whose dir is
// looked up in `AGENT_SKILL_DIRS`, preserving the original if-cascade order:
// cursor → gemini/antigravity → claude/anthropic/gstack/garrytan →
// windsurf → copilot → default.
const REPO_DIR_RULES: ReadonlyArray<{ keywords: string[]; agent: AgentId }> = [
  { keywords: ["cursor"], agent: "cursor" },
  { keywords: ["gemini", "antigravity"], agent: "gemini" },
  { keywords: ["claude", "anthropic", "gstack", "garrytan"], agent: "claude-code" },
  { keywords: ["windsurf"], agent: "windsurf" },
  { keywords: ["copilot"], agent: "copilot" },
];

function globalDirForRepo(owner: string, repo: string): string {
  const repoStr = `${owner}/${repo}`.toLowerCase();
  const rule = REPO_DIR_RULES.find(({ keywords }) =>
    keywords.some((k) => repoStr.includes(k)),
  );
  const agent: AgentId = rule?.agent ?? "generic";
  return AGENT_SKILL_DIRS.find(({ agent: a }) => a === agent)?.dir ?? ".skills";
}

// Native port of `downloadSkillFromGitHub` (`src/backend/installer.ts`): pure
// JS fetch (raw `main→master` SKILL.md via Task 3 `fetchSkillMd`, commit SHA
// via `fetchLatestCommit`) + native writes through the Task 7 `skills-fs`
// `ensureDir`/`writeTextFile` surface. Missing SKILL.md falls back to a
// `source_url` template so the skill stays discoverable (installer parity).
export async function downloadSkill(
  options: DownloadSkillOptions,
  deps: DownloadSkillDeps = {},
): Promise<DownloadSkillResult> {
  const writer = deps.writer ?? defaultSkillWriter;
  const fetchImpl = deps.fetchImpl;
  const lockStore = deps.lockStore ?? storageJsonStore();

  const repoInfo = parseGitHubRepo(options.source);
  if (!repoInfo) {
    return { ok: false, error: "Invalid GitHub repository format" };
  }
  const pathParts = repoInfo.path?.split("/").filter(Boolean) ?? [];
  const skillSlug = options.skillName ?? pathParts[pathParts.length - 1] ?? repoInfo.repo;
  if (!validateSafeSlug(skillSlug)) {
    return { ok: false, error: `Refusing to install unsafe skill slug: ${skillSlug}` };
  }

  const globalDir = globalDirForRepo(repoInfo.owner, repoInfo.repo);
  const targetDir =
    options.targetDir ?? `~/${globalDir}/${repoInfo.owner}/${skillSlug}`;
  const repoUrl = `${repoInfo.owner}/${repoInfo.repo}${repoInfo.path ? `/tree/main/${repoInfo.path}` : ""}`;

  try {
    const skillContent =
      (await fetchSkillMd(repoInfo, options.token, fetchImpl)) ??
      `---\nname: ${skillSlug}\ndescription: Skill installed from ${repoUrl}\nsource_url: https://github.com/${repoUrl}\n---\n\n# ${skillSlug}\n\nInstalled from https://github.com/${repoUrl}\n`;

    if (!(await writer.ensureDir(targetDir))) {
      return { ok: false, error: `Could not create install directory: ${targetDir}` };
    }
    if (!(await writer.writeTextFile(`${targetDir}/SKILL.md`, skillContent))) {
      return { ok: false, error: `Could not write SKILL.md to: ${targetDir}` };
    }

    // Non-fatal lockfile bookkeeping (updater.ts parity): records the source
    // commit so a future update check can diff SHAs.
    try {
      const commitSha = await fetchLatestCommit(options.source, options.token, fetchImpl);
      const lock = await loadSkillsLock(lockStore);
      const pkgKey = `${repoInfo.owner}/${repoInfo.repo}`;
      lock[pkgKey] = {
        source: options.source,
        commitSha: commitSha ?? "initial",
        updatedAt: new Date().toISOString(),
        skills: [skillSlug],
      };
      await saveSkillsLock(lock, lockStore);
    } catch {
      // Non-fatal lockfile update error
    }

    return { ok: true, path: targetDir };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export interface UninstallSkillRequest {
  skillPath: string; // absolute path of the installed skill dir
  skillSlug: string;
  workspacePaths?: string[]; // absolute workspace paths to sweep for symlinks
}

// Native port of `uninstallSkill` (`src/backend/installer.ts`): unlinks the
// skill dir itself plus any `<workspace>/.skills/<slug>` links pointing at it.
// `removeItemAtPath` removes links without touching targets, so unlike the
// Deno `lstat`/`realPath` dance there is no need to resolve first. Slug-guard
// + absolute-path preconditions mirror `toggleSkill`.
export async function uninstallSkill(
  req: UninstallSkillRequest,
  fs: SkillsFs = defaultSkillsFs,
): Promise<boolean> {
  if (!validateSafeSlug(req.skillSlug)) {
    return false;
  }
  try {
    for (const workspacePath of req.workspacePaths ?? []) {
      const linksDir = `${normalizeWs(workspacePath)}/${WORKSPACE_SKILLS_REL}`;
      let entries: string[];
      try {
        entries = await fs.scanSkillsDir(linksDir);
      } catch {
        continue;
      }
      for (const full of entries) {
        if ((full.split("/").pop() ?? full) === req.skillSlug.trim()) {
          try {
            await fs.unlink(full);
          } catch {
              // Best-effort sweep: one stuck link must not block the uninstall
          }
        }
      }
    }
    return await fs.unlink(req.skillPath);
  } catch {
    return false;
  }
}

export const listSkillsEffect = (
  dirs: readonly string[] = DEFAULT_SKILL_DIRS,
  fs: SkillsFs = defaultSkillsFs,
): Effect.Effect<Skill[], FsError> =>
  Effect.tryPromise({
    try: () => getSkills(dirs, fs),
    catch: (err) =>
      new FsError({
        operation: "listSkills",
        path: dirs.join(", "),
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export const listSkills = (
  dirs?: readonly string[],
  fs?: SkillsFs,
): Promise<Skill[]> => getSkills(dirs, fs);

export const readSkillMdEffect = (
  path: string,
  fs: SkillsFs = defaultSkillsFs,
): Effect.Effect<string, FsError> =>
  Effect.tryPromise({
    try: () => fs.readSkillMd(path),
    catch: (err) =>
      new FsError({
        operation: "readSkillMd",
        path,
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export const readSkillMd = (
  path: string,
  fs: SkillsFs = defaultSkillsFs,
): Promise<string> => fs.readSkillMd(path);

export const toggleSkillEffect = (
  req: ToggleSkillRequest,
  fs: SkillsFs = defaultSkillsFs,
): Effect.Effect<boolean, InvalidSlugError | FsError> =>
  Effect.gen(function* () {
    const target = resolveSkillTarget(req.workspacePath, req.skillSlug);
    if (!target) {
      return yield* Effect.fail(new InvalidSlugError({ slug: req.skillSlug }));
    }
    return yield* Effect.tryPromise({
      try: () => (req.enable ? fs.symlink(req.sourcePath, target) : fs.unlink(target)),
      catch: (err) =>
        new FsError({
          operation: req.enable ? "symlink" : "unlink",
          path: target,
          message: err instanceof Error ? err.message : String(err),
        }),
    });
  });

export const copySkillToWorkspaceEffect = (
  skillSlug: string,
  sourcePath: string,
  workspacePath: string,
  deps: { fs?: SkillsFs; writer?: SkillWriter } = {},
): Effect.Effect<boolean, InvalidSlugError | FsError> =>
  Effect.gen(function* () {
    const target = resolveSkillTarget(workspacePath, skillSlug);
    if (!target) {
      return yield* Effect.fail(new InvalidSlugError({ slug: skillSlug }));
    }
    const fs = deps.fs ?? defaultSkillsFs;
    const writer = deps.writer ?? defaultSkillWriter;

    const skillMdPath = sourcePath.endsWith("SKILL.md")
      ? sourcePath
      : `${sourcePath}/SKILL.md`;

    const content = yield* Effect.tryPromise({
      try: () => fs.readSkillMd(skillMdPath),
      catch: (err) =>
        new FsError({
          operation: "readSkillMd",
          path: skillMdPath,
          message: err instanceof Error ? err.message : String(err),
        }),
    });

    yield* Effect.tryPromise({
      try: () => writer.ensureDir(target),
      catch: (err) =>
        new FsError({
          operation: "ensureDir",
          path: target,
          message: err instanceof Error ? err.message : String(err),
        }),
    });

    yield* Effect.tryPromise({
      try: () => writer.writeTextFile(`${target}/SKILL.md`, content),
      catch: (err) =>
        new FsError({
          operation: "writeTextFile",
          path: `${target}/SKILL.md`,
          message: err instanceof Error ? err.message : String(err),
        }),
    });

    return true;
  });

export const copySkillToWorkspace = (
  skillSlug: string,
  sourcePath: string,
  workspacePath: string,
  deps?: { fs?: SkillsFs; writer?: SkillWriter },
): Promise<boolean> =>
  Effect.runPromise(copySkillToWorkspaceEffect(skillSlug, sourcePath, workspacePath, deps));

export interface SkillsFileSystemService {
  readonly listSkills: (dirs?: readonly string[]) => Effect.Effect<Skill[], FsError>;
  readonly readSkillMd: (path: string) => Effect.Effect<string, FsError>;
  readonly toggleSkill: (req: ToggleSkillRequest) => Effect.Effect<boolean, InvalidSlugError | FsError>;
  readonly copySkillToWorkspace: (
    skillSlug: string,
    sourcePath: string,
    workspacePath: string,
  ) => Effect.Effect<boolean, InvalidSlugError | FsError>;
}

export class SkillsFileSystem extends Context.Service<SkillsFileSystem, SkillsFileSystemService>()(
  "SkillsFileSystem",
) {}

export const LiveSkillsFileSystem = Layer.succeed(SkillsFileSystem, {
  listSkills: (dirs) => listSkillsEffect(dirs),
  readSkillMd: (path) => readSkillMdEffect(path),
  toggleSkill: (req) => toggleSkillEffect(req),
  copySkillToWorkspace: (slug, src, ws) => copySkillToWorkspaceEffect(slug, src, ws),
});

