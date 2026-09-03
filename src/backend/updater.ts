import { Skill } from "../types/skills.ts";
import { ensureParentDir } from "./fs.ts";

export interface LockFileEntry {
  source: string;
  commitSha: string;
  updatedAt: string;
  skills: string[];
}

export type SkillsLock = Record<string, LockFileEntry>;

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  path?: string; // Subdirectory path within the repo
}

/**
 * Parses a GitHub repository string into owner, repo, and optional path components.
 * Supports shorthand (owner/repo/path), HTTPS GitHub URLs, and skills.sh URLs.
 */
export function parseGitHubRepo(input: string): GitHubRepoInfo | null {
  if (!input) return null;

  let cleaned = input.trim().replace(/\.git$/, "");
  
  // Strip trailing slashes
  cleaned = cleaned.replace(/\/$/, "");

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
export async function fetchLatestGitHubCommit(ownerRepo: string, token?: string): Promise<string | null> {
  const parsed = parseGitHubRepo(ownerRepo);
  if (!parsed) return null;

  const headers = new Headers({
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
  });
  if (token) {
    headers.set("Authorization", `token ${token}`);
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/commits?per_page=1`,
      { headers }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.sha || null;
  } catch {
    return null;
  }
}

/**
 * Loads skills-lock.json file if present, or returns an empty lock object.
 */
export async function loadSkillsLock(lockFilePath?: string): Promise<SkillsLock> {
  const defaultPath = `${Deno.env.get("HOME") || ""}/.skills/skills-lock.json`;
  const targetPath = lockFilePath || defaultPath;

  try {
    const content = await Deno.readTextFile(targetPath);
    // SAFETY: skills-lock.json persists as a JSON-serialized SkillsLock record
    return JSON.parse(content) as SkillsLock;
  } catch {
    return {};
  }
}

/**
 * Saves the skills-lock.json file.
 */
export async function saveSkillsLock(lock: SkillsLock, lockFilePath?: string): Promise<boolean> {
  const defaultPath = `${Deno.env.get("HOME") || ""}/.skills/skills-lock.json`;
  const targetPath = lockFilePath || defaultPath;

  try {
    await ensureParentDir(targetPath);
    await Deno.writeTextFile(targetPath, JSON.stringify(lock, null, 2));
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks a list of skills against the lockfile and GitHub API for available updates.
 */
export async function checkSkillUpdates(
  skills: Skill[],
  lockFilePath?: string,
  token?: string
): Promise<Record<string, boolean>> {
  const lock = await loadSkillsLock(lockFilePath);
  const updates: Record<string, boolean> = {};

  const packagesToCheck = new Set<string>();
  for (const skill of skills) {
    if (skill.packageName && parseGitHubRepo(skill.packageName)) {
      packagesToCheck.add(skill.packageName);
    }
  }

  for (const pkg of packagesToCheck) {
    const lockEntry = lock[pkg];
    const remoteSha = await fetchLatestGitHubCommit(pkg, token);
    if (remoteSha) {
      const needsUpdate = compareCommitShas(lockEntry?.commitSha, remoteSha);
      updates[pkg] = needsUpdate;
    }
  }

  return updates;
}
