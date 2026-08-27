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

  // 1. skills.sh URLs: https://www.skills.sh/owner/repo/path
  const skillsShMatch = cleaned.match(/^https?:\/\/(?:www\.)?skills\.sh\/([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (skillsShMatch) {
    return { owner: skillsShMatch[1], repo: skillsShMatch[2], path: skillsShMatch[3] || undefined };
  }

  // 2. HTTPS GitHub URL format: https://github.com/owner/repo[/tree/main/path]
  const httpsMatch = cleaned.match(/^https?:\/\/github\.com\/([\w.-]+)\/([\w.-]+)(?:\/(?:tree|blob)\/[^/]+\/(.*))?$/);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2], path: httpsMatch[3] || undefined };
  }

  // 3. SSH GitHub URL format: git@github.com:owner/repo
  const sshMatch = cleaned.match(/^git@github\.com:([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2], path: sshMatch[3] || undefined };
  }

  // 4. Shorthand format: owner/repo[/path]
  const shortMatch = cleaned.match(/^([\w.-]+)\/([\w.-]+)(?:\/(.*))?$/);
  if (shortMatch) {
    return { owner: shortMatch[1], repo: shortMatch[2], path: shortMatch[3] || undefined };
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
