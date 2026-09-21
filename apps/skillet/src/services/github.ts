import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import * as Schema from "effect/Schema";
import { GitHubRateLimitError, RepoNotFoundError, GitHubNetworkError } from "./errors";
import { GitHubTreeItemSchema, type GitHubTreeItem } from "./schemas";
import { storageJsonStore, type JsonStore } from "./workspaces";

// GitHub service for the macOS app, porting the pure + fetch logic from
// `src/backend/updater.ts` (repo parser, commit check, lockfile) and the raw
// `main→master` SKILL.md fetch from `src/backend/installer.ts`. Plain
// `fetch` works in the RN runtime; callers may inject a `FetchFn` in tests.

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  path?: string; // Subdirectory path within the repo
  branch?: string; // Resolved default branch (set by browseRepoForSkills)
}

export type RepoInfo = GitHubRepoInfo;

export interface SkillsLockEntry {
  source: string;
  commitSha: string;
  updatedAt: string;
  skills: string[];
}

export type SkillsLock = Record<string, SkillsLockEntry>;

export interface FetchResponse {
  ok: boolean;
  json(): Promise<unknown>;
  text(): Promise<string>;
}

export type FetchFn = (
  url: string,
  init?: { headers?: Record<string, string> },
) => Promise<FetchResponse>;

export const defaultFetch: FetchFn = (url, init) => globalThis.fetch(url, init);

const SKILLS_LOCK_FILE = "skills-lock.json";

/**
 * Parses a GitHub repository string into owner, repo, and optional path components.
 * Supports shorthand (owner/repo/path), HTTPS GitHub URLs, and skills.sh URLs.
 */
export function parseGitHubRepo(input: string): GitHubRepoInfo | null {
  if (!input) return null;

  const cleaned = input.trim().replace(/\.git$/, "").replace(/\/$/, "");

  const buildResult = (owner: string, repo: string, subPath?: string): GitHubRepoInfo => {
    return subPath ? { owner, repo, path: subPath } : { owner, repo };
  };

  const getCustomDefaultRepo = (ownerLower: string): string => {
    if (ownerLower === "garrytan") return "gstack";
    if (ownerLower === "addyosmani") return "agent-skills";
    if (ownerLower === "cursor") return "plugins";
    return "skills";
  };

  // 1. skills.sh URLs: https://www.skills.sh/owner/repo/path or https://www.skills.sh/owner
  const skillsShMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (skillsShMatch) {
    return buildResult(skillsShMatch[1], skillsShMatch[2], skillsShMatch[3]);
  }

  const skillsShOwnerMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)$/);
  if (skillsShOwnerMatch) {
    const owner = skillsShOwnerMatch[1];
    return buildResult(owner, getCustomDefaultRepo(owner.toLowerCase()));
  }

  // 2. HTTPS GitHub URL format: https://github.com/owner/repo[/tree/main/path]
  const httpsMatch = cleaned.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/[^/]+\/(.*)|\/.*)?$/);
  if (httpsMatch) {
    return buildResult(httpsMatch[1], httpsMatch[2], httpsMatch[3]);
  }

  // 3. SSH GitHub URL format: git@github.com:owner/repo
  const sshMatch = cleaned.match(/^git@github\.com:([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (sshMatch) {
    return buildResult(sshMatch[1], sshMatch[2], sshMatch[3]);
  }

  // 4. Shorthand format: owner/repo[/path]
  const shortMatch = cleaned.match(/^([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (shortMatch) {
    return buildResult(shortMatch[1], shortMatch[2], shortMatch[3]);
  }

  // 5. Known standalone owner shorthand (e.g. garrytan, mattpocock, expo)
  const KNOWN_SKILLS_CREATORS = new Set([
    "anthropics",
    "cursor",
    "vercel-labs",
    "cloudflare",
    "expo",
    "mattpocock",
    "addyosmani",
    "garrytan",
  ]);
  const lower = cleaned.toLowerCase();
  if (/^[\w.-]+$/.test(cleaned) && KNOWN_SKILLS_CREATORS.has(lower)) {
    return buildResult(cleaned, getCustomDefaultRepo(lower));
  }

  return null;
}

/**
 * Compares local and remote commit SHAs.
 * Returns true if an update is needed (i.e. SHAs are missing or differ).
 */
export function compareCommitShas(localSha?: string, remoteSha?: string): boolean {
  if (!localSha || !remoteSha || !localSha.trim() || !remoteSha.trim()) {
    return true;
  }
  return localSha.trim().toLowerCase() !== remoteSha.trim().toLowerCase();
}

/**
 * Shared GitHub API headers: UA + v3 Accept, plus `token` auth when provided.
 */
export function buildGitHubHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  return headers;
}

/**
 * Fetches the latest commit SHA for a GitHub repository using the GitHub REST API.
 */
export async function fetchLatestCommit(
  source: string,
  token?: string,
  fetchImpl: FetchFn = defaultFetch,
): Promise<string | null> {
  const parsed = parseGitHubRepo(source);
  if (!parsed) return null;

  const headers = buildGitHubHeaders(token);

  try {
    const res = await fetchImpl(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1`,
      { headers },
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    // SAFETY: GitHub commits API returns objects with a string sha field
    const first = data[0] as { sha?: unknown } | undefined;
    return typeof first?.sha === "string" ? first.sha : null;
  } catch {
    return null;
  }
}

/**
 * Fetches a repo's SKILL.md from raw.githubusercontent.com, trying the
 * `main` branch first and falling back to `master` (installer.ts parity).
 */
export async function fetchSkillMd(
  info: GitHubRepoInfo,
  token?: string,
  fetchImpl: FetchFn = defaultFetch,
): Promise<string | null> {
  const headers = buildGitHubHeaders(token);

  const subpath = info.path ? `/${info.path}` : "";
  for (const branch of ["main", "master"]) {
    try {
      const res = await fetchImpl(
        `https://raw.githubusercontent.com/${info.owner}/${info.repo}/${branch}${subpath}/SKILL.md`,
        { headers },
      );
      if (res.ok) {
        return await res.text();
      }
    } catch {
      // Try next branch
    }
  }
  return null;
}

/**
 * Loads skills-lock.json if present, or returns an empty lock object.
 */
export async function loadSkillsLock(store: JsonStore = storageJsonStore()): Promise<SkillsLock> {
  try {
    const parsed = store.readJson<unknown>(SKILLS_LOCK_FILE);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      // SAFETY: skills-lock.json persists as a JSON-serialized SkillsLock record
      return parsed as SkillsLock;
    }
  } catch {
    // Fall through to empty lock
  }
  return {};
}

/**
 * Saves the skills-lock.json file.
 */
export async function saveSkillsLock(
  lock: SkillsLock,
  store: JsonStore = storageJsonStore(),
): Promise<boolean> {
  try {
    store.writeJson(SKILLS_LOCK_FILE, lock);
    return true;
  } catch {
    return false;
  }
}

// --- Discover service (moved from `tabs/DiscoverTab.tsx`): search any
// GitHub repo for skills via the trees API plus a curated popular list. ---

export interface PopularRepo {
  owner: string;
  repo: string;
  fullName: string;
  desc: string;
}

export const POPULAR_REPOS: PopularRepo[] = [
  { owner: "anthropics", repo: "skills", fullName: "anthropics/skills", desc: "Official Anthropic agent skills and guidelines." },
  { owner: "cursor", repo: "plugins", fullName: "cursor/plugins", desc: "Official Cursor community skills repository." },
  { owner: "vercel-labs", repo: "skills", fullName: "vercel-labs/skills", desc: "Foundational skills and examples from Vercel." },
  { owner: "cloudflare", repo: "skills", fullName: "cloudflare/skills", desc: "Skills for teaching agents to build on Cloudflare." },
  { owner: "expo", repo: "skills", fullName: "expo/skills", desc: "Official AI agent skills for Expo & React Native." },
  { owner: "mattpocock", repo: "skills", fullName: "mattpocock/skills", desc: "Skills for Real Engineers by Matt Pocock." },
  { owner: "addyosmani", repo: "agent-skills", fullName: "addyosmani/agent-skills", desc: "Production-grade engineering skills by Addy Osmani." },
  { owner: "garrytan", repo: "gstack", fullName: "garrytan/gstack", desc: "Garry Tan's Claude Code setup with 23+ skills & tools." },
];

export interface DiscoveredSkillItem {
  name: string;
  path: string;
  htmlUrl: string;
}

interface TreeEntry {
  type: string;
  path: string;
}

// Pure mapping of a recursive GitHub trees response to installable rows:
// keeps SKILL.md-bearing dirs (plus cursor-rules files, web parity), scopes to
// the searched subpath when one was given, dedups by dir path. Pure so the
// discover flow stays unit-testable without the RN runtime or network.
export function mapTreeToSkillItems(
  tree: TreeEntry[],
  repo: GitHubRepoInfo,
): DiscoveredSkillItem[] {
  // `branch` is optional on the parsed type (`parseGitHubRepo` never sets it;
  // only `browseRepoForSkills` resolves it) — default to `main` so direct
  // callers never emit `tree/undefined/...` links. Matches the `main` fallback
  // convention in `browseRepoForSkills` below; the in-app path always passes a
  // resolved branch.
  const branch = repo.branch ?? "main";
  const seen = new Map<string, DiscoveredSkillItem>();
  for (const entry of tree) {
    if (entry.type !== "blob") continue;
    if (
      !entry.path.endsWith("SKILL.md") &&
      !entry.path.endsWith(".cursorrules") &&
      !entry.path.endsWith("cursorrules")
    ) {
      continue;
    }
    if (repo.path) {
      const scope = repo.path.replace(/\/+$/, "");
      if (entry.path !== scope && !entry.path.startsWith(`${scope}/`)) continue;
    }
    const parts = entry.path.split("/");
    parts.pop();
    const dirPath = parts.join("/");
    if (seen.has(dirPath)) continue;
    const name = parts.length > 0 ? parts[parts.length - 1] : repo.repo;
    seen.set(dirPath, {
      name,
      path: dirPath,
      htmlUrl: `https://github.com/${repo.owner}/${repo.repo}/tree/${branch}${dirPath === "" ? "" : `/${dirPath}`}`,
    });
  }
  return [...seen.values()];
}

type ApiResponse = FetchResponse & { status?: number };

export interface BrowseRepoOptions {
  token?: string;
  fetchImpl?: FetchFn;
}

export interface BrowseRepoResult {
  repo: GitHubRepoInfo;
  items: DiscoveredSkillItem[];
}

function rateLimitError(status?: number): boolean {
  return status === 403 || status === 429;
}

// Service-routed Discover search: repo metadata → default branch → recursive
// tree → `mapTreeToSkillItems`. Takes an already-parsed `GitHubRepoInfo`
// (callers validate with `parseGitHubRepo` first). Injectable
// `fetchImpl`/`token` (`FetchFn` contract) so tests pin headers and callers
// can pass an authed fetch later.
export async function browseRepoForSkills(
  info: GitHubRepoInfo,
  options: BrowseRepoOptions = {},
): Promise<BrowseRepoResult> {
  const fetchImpl = options.fetchImpl ?? defaultFetch;
  const headers = buildGitHubHeaders(options.token);
  let repoRes: ApiResponse;
  try {
    // SAFETY: `FetchFn` implementers return the `FetchResponse` shape plus an
    // optional numeric `status`; `ApiResponse` only narrows `status` to optional.
    repoRes = (await fetchImpl(
      `https://api.github.com/repos/${info.owner}/${info.repo}`,
      { headers },
    )) as ApiResponse;
  } catch {
    throw new Error("Failed to fetch repository");
  }
  if (!repoRes.ok) {
    if (rateLimitError(repoRes.status)) {
      throw new Error("GitHub rate limit exceeded. Add a token or try again later.");
    }
    throw new Error("Repository not found");
  }
  // SAFETY: GitHub repo metadata is a JSON object; `default_branch` is
  // narrowed with `typeof` before use, so the wide record cast is safe.
  const repoData = (await repoRes.json()) as { default_branch?: unknown };
  const branch = typeof repoData.default_branch === "string" ? repoData.default_branch : "main";
  let treeRes: ApiResponse;
  try {
    // SAFETY: same `FetchFn` → `ApiResponse` narrowing as the repo call above.
    treeRes = (await fetchImpl(
      `https://api.github.com/repos/${info.owner}/${info.repo}/git/trees/${branch}?recursive=1`,
      { headers },
    )) as ApiResponse;
  } catch {
    throw new Error("Failed to fetch repository tree");
  }
  if (!treeRes.ok) {
    if (rateLimitError(treeRes.status)) {
      throw new Error("GitHub rate limit exceeded. Add a token or try again later.");
    }
    throw new Error("Failed to fetch repository tree");
  }
  // SAFETY: GitHub trees API returns a JSON object with an optional `tree`
  // array; `Array.isArray` below guarantees an array before entries are read.
  const treeData = (await treeRes.json()) as { tree?: unknown };
  // SAFETY: same payload as above — still an array here only when the
  // `Array.isArray` guard passes, and each entry's fields are narrowed to
  // strings by the type-predicate filter that follows.
  const rawEntries = treeData.tree as { type?: unknown; path?: unknown }[];
  const tree = Array.isArray(treeData.tree)
    ? rawEntries.filter(
      (e): e is { type: string; path: string } =>
        typeof e.type === "string" && typeof e.path === "string",
    )
    : [];
  const repo: GitHubRepoInfo = { owner: info.owner, repo: info.repo, path: info.path, branch };
  const rows = mapTreeToSkillItems(tree, repo);
  if (rows.length === 0) throw new Error("No skills found in this repository");
  return { repo, items: rows };
}

// Source string the installer consumes for a discovered row
// (`owner/repo[/path]` shorthand, same acceptance as `parseGitHubRepo`).
export function buildInstallSource(
  repo: { owner: string; repo: string },
  itemPath: string,
): string {
  return itemPath === "" ? `${repo.owner}/${repo.repo}` : `${repo.owner}/${repo.repo}/${itemPath}`;
}

export const gitHubRetrySchedule = Schedule.exponential("250 millis").pipe(
  Schedule.upTo({ times: 3 }),
);

function requestWithRetry<T>(
  fn: () => Promise<T>,
): Effect.Effect<T, GitHubNetworkError> {
  return Effect.tryPromise({
    try: fn,
    catch: (err) =>
      new GitHubNetworkError({
        message: err instanceof Error ? err.message : String(err),
      }),
  }).pipe(
    Effect.retry({
      schedule: gitHubRetrySchedule,
      while: (err) => err._tag === "GitHubNetworkError",
    }),
  );
}

export type GitHubRepoInfoMetadata = {
  defaultBranch: string;
  description: string | null;
  stars: number;
  updatedAt: string;
};

export const fetchRepoTreeEffect = (
  repo: string,
  branch: string,
  options: { token?: string; fetchImpl?: FetchFn } = {},
): Effect.Effect<readonly GitHubTreeItem[], GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError> =>
  Effect.gen(function* () {
    const parsed = parseGitHubRepo(repo);
    if (!parsed) {
      return yield* Effect.fail(
        new RepoNotFoundError({
          owner: "",
          repo,
          message: `Invalid repo format: ${repo}`,
        }),
      );
    }
    const headers = buildGitHubHeaders(options.token);
    const fetchImpl = options.fetchImpl ?? defaultFetch;
    const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${branch}?recursive=1`;

    const res = yield* requestWithRetry(() => fetchImpl(url, { headers }));

    if (!res.ok) {
      const status = (res as ApiResponse).status;
      if (status === 404 || (!status && !res.ok)) {
        return yield* Effect.fail(
          new RepoNotFoundError({
            owner: parsed.owner,
            repo: parsed.repo,
            message: "Repository or branch not found",
          }),
        );
      }
      if (rateLimitError(status)) {
        return yield* Effect.fail(
          new GitHubRateLimitError({
            message: "GitHub rate limit exceeded. Add a token or try again later.",
          }),
        );
      }
      return yield* Effect.fail(
        new GitHubNetworkError({
          message: `GitHub API error: status ${status ?? "unknown"}`,
          status,
        }),
      );
    }

    const data = (yield* Effect.tryPromise({
      try: () => res.json(),
      catch: (e) =>
        new GitHubNetworkError({
          message: `Failed to parse tree JSON: ${e instanceof Error ? e.message : String(e)}`,
        }),
    })) as { tree?: unknown };

    if (!Array.isArray(data?.tree)) {
      return [];
    }

    return Schema.decodeUnknownSync(Schema.Array(GitHubTreeItemSchema))(data.tree);
  });

export const fetchRawFileEffect = (
  repo: string,
  branch: string,
  path: string,
  options: { token?: string; fetchImpl?: FetchFn } = {},
): Effect.Effect<string, RepoNotFoundError | GitHubNetworkError> =>
  Effect.gen(function* () {
    const parsed = parseGitHubRepo(repo);
    if (!parsed) {
      return yield* Effect.fail(
        new RepoNotFoundError({
          owner: "",
          repo,
          message: `Invalid repo format: ${repo}`,
        }),
      );
    }
    const headers = buildGitHubHeaders(options.token);
    const fetchImpl = options.fetchImpl ?? defaultFetch;
    const cleanPath = path.replace(/^\/+/, "");
    const url = `https://raw.githubusercontent.com/${parsed.owner}/${parsed.repo}/${branch}/${cleanPath}`;

    const res = yield* requestWithRetry(() => fetchImpl(url, { headers }));

    if (!res.ok) {
      const status = (res as ApiResponse).status;
      if (status === 404 || (!status && !res.ok)) {
        return yield* Effect.fail(
          new RepoNotFoundError({
            owner: parsed.owner,
            repo: parsed.repo,
            message: `File not found: ${path}`,
          }),
        );
      }
      return yield* Effect.fail(
        new GitHubNetworkError({
          message: `Failed to fetch raw file: status ${status ?? "unknown"}`,
          status,
        }),
      );
    }

    return yield* Effect.tryPromise({
      try: () => res.text(),
      catch: (e) =>
        new GitHubNetworkError({
          message: `Failed to read response text: ${e instanceof Error ? e.message : String(e)}`,
        }),
    });
  });

export const getRepoInfoEffect = (
  repo: string,
  options: { token?: string; fetchImpl?: FetchFn } = {},
): Effect.Effect<GitHubRepoInfoMetadata, GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError> =>
  Effect.gen(function* () {
    const parsed = parseGitHubRepo(repo);
    if (!parsed) {
      return yield* Effect.fail(
        new RepoNotFoundError({
          owner: "",
          repo,
          message: `Invalid repo format: ${repo}`,
        }),
      );
    }
    const headers = buildGitHubHeaders(options.token);
    const fetchImpl = options.fetchImpl ?? defaultFetch;
    const url = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}`;

    const res = yield* requestWithRetry(() => fetchImpl(url, { headers }));

    if (!res.ok) {
      const status = (res as ApiResponse).status;
      if (status === 404 || (!status && !res.ok)) {
        return yield* Effect.fail(
          new RepoNotFoundError({
            owner: parsed.owner,
            repo: parsed.repo,
            message: `Repository not found: ${parsed.owner}/${parsed.repo}`,
          }),
        );
      }
      if (rateLimitError(status)) {
        return yield* Effect.fail(
          new GitHubRateLimitError({
            message: "GitHub rate limit exceeded. Add a token or try again later.",
          }),
        );
      }
      return yield* Effect.fail(
        new GitHubNetworkError({
          message: `GitHub API error: status ${status ?? "unknown"}`,
          status,
        }),
      );
    }

    const data = (yield* Effect.tryPromise({
      try: () => res.json(),
      catch: (e) =>
        new GitHubNetworkError({
          message: `Failed to parse repo info JSON: ${e instanceof Error ? e.message : String(e)}`,
        }),
    })) as Record<string, unknown>;

    return {
      defaultBranch: typeof data.default_branch === "string" ? data.default_branch : "main",
      description: typeof data.description === "string" ? data.description : null,
      stars: typeof data.stargazers_count === "number" ? data.stargazers_count : 0,
      updatedAt: typeof data.updated_at === "string" ? data.updated_at : "",
    };
  });

export const fetchRepoTree = (
  repo: string,
  branch: string,
  options?: BrowseRepoOptions,
): Promise<readonly GitHubTreeItem[]> => Effect.runPromise(fetchRepoTreeEffect(repo, branch, options));

export const fetchRawFile = (
  repo: string,
  branch: string,
  path: string,
  options?: { token?: string; fetchImpl?: FetchFn },
): Promise<string> => Effect.runPromise(fetchRawFileEffect(repo, branch, path, options));

export const getRepoInfo = (
  repo: string,
  options?: { token?: string; fetchImpl?: FetchFn },
): Promise<GitHubRepoInfoMetadata> => Effect.runPromise(getRepoInfoEffect(repo, options));

export interface GitHubClientService {
  readonly fetchRepoTree: (
    repo: string,
    branch: string,
    options?: { token?: string; fetchImpl?: FetchFn },
  ) => Effect.Effect<readonly GitHubTreeItem[], GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError>;
  readonly fetchRawFile: (
    repo: string,
    branch: string,
    path: string,
    options?: { token?: string; fetchImpl?: FetchFn },
  ) => Effect.Effect<string, GitHubNetworkError | RepoNotFoundError>;
  readonly getRepoInfo: (
    repo: string,
    options?: { token?: string; fetchImpl?: FetchFn },
  ) => Effect.Effect<GitHubRepoInfoMetadata, GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError>;
}

export class GitHubClient extends Context.Service<GitHubClient, GitHubClientService>()(
  "GitHubClient",
) {}

export const LiveGitHubClient = Layer.succeed(GitHubClient, {
  fetchRepoTree: (repo, branch, opts) => fetchRepoTreeEffect(repo, branch, opts),
  fetchRawFile: (repo, branch, path, opts) => fetchRawFileEffect(repo, branch, path, opts),
  getRepoInfo: (repo, opts) => getRepoInfoEffect(repo, opts),
});

