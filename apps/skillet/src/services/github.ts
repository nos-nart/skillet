import { storageJsonStore, type JsonStore } from "./workspaces";

// GitHub service for the macOS app, porting the pure + fetch logic from
// `src/backend/updater.ts` (repo parser, commit check, lockfile) and the raw
// `main→master` SKILL.md fetch from `src/backend/installer.ts`. Plain
// `fetch` works in the RN runtime; callers may inject a `FetchFn` in tests.

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  path?: string; // Subdirectory path within the repo
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

const defaultFetch: FetchFn = (url, init) => globalThis.fetch(url, init);

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
 * Fetches the latest commit SHA for a GitHub repository using the GitHub REST API.
 */
export async function fetchLatestCommit(
  source: string,
  token?: string,
  fetchImpl: FetchFn = defaultFetch,
): Promise<string | null> {
  const parsed = parseGitHubRepo(source);
  if (!parsed) return null;

  const headers: Record<string, string> = {
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

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
  const headers: Record<string, string> = {
    "User-Agent": "Skillet-Desktop-App",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

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
