import {
  readSkillMd,
  scanSkillsDir,
  symlink,
  unlink,
  validateSafeSlug,
} from "@skillet/skills-fs";

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
  agent: AgentId;
  enable: boolean;
}

export interface SkillsFs {
  scanSkillsDir(dir: string): Promise<string[]>;
  readSkillMd(path: string): Promise<string>;
  symlink(source: string, target: string): Promise<boolean>;
  unlink(target: string): Promise<boolean>;
}

const defaultSkillsFs: SkillsFs = { scanSkillsDir, readSkillMd, symlink, unlink };

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
  const fields = parseFrontmatterFields(m[1]);
  const name = fieldAsString(fields, "name") ?? "Unnamed Skill";
  return {
    metadata: {
      name,
      description: fieldAsString(fields, "description") ?? "",
      author: fieldAsString(fields, "author"),
      version: fieldAsString(fields, "version"),
      trigger:
        fieldAsString(fields, "trigger") ??
        `/${name.toLowerCase().replace(/\s+/g, "-")}`,
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

// Verbatim port of `resolveSafeTarget` from `src/backend/symlinker.ts`.
export function resolveSkillTarget(workspacePath: string, skillSlug: string): string | null {
  if (!validateSafeSlug(skillSlug)) {
    return null;
  }
  const normalizedWs = workspacePath.replace(/\/+$/, "");
  const target = `${normalizedWs}/${WORKSPACE_SKILLS_REL}/${skillSlug}`;

  // Ensure resolved path doesn't escape workspace
  if (!target.startsWith(normalizedWs)) {
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
  const found: FoundSkillDoc[] = [];
  for (const dir of dirs) {
    await walkSkillsDir(fs, dir, "", agentForDir(dir), 0, found);
  }

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
  const normalizedWs = workspacePath.replace(/\/+$/, "");
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
