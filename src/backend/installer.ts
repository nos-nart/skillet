import { parseGitHubRepo, fetchLatestGitHubCommit, loadSkillsLock, saveSkillsLock } from "./updater.ts";
import { ensureDir, ensureParentDir } from "./fs.ts";

export interface InstallSkillOptions {
  source: string; // e.g. "github-user/skill-repo" or local path
  skillName?: string;
  targetDir?: string;
  token?: string;
}

export type InstallResult =
  | { ok: true; path: string }
  | { ok: false; error: string };

export type UninstallResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Downloads and installs a skill from a GitHub repository or local path,
 * writing the SKILL.md file and updating the skills-lock.json.
 */
export async function downloadSkillFromGitHub(
  options: InstallSkillOptions
): Promise<InstallResult> {
  const home = Deno.env.get("HOME") || "/tmp";

  // Check if source is a local directory
  if (options.source.startsWith("/") || options.source.startsWith("./") || options.source.startsWith("~/")) {
    const resolvedPath = options.source.replace(/^~/, home);
    try {
      const stat = await Deno.stat(resolvedPath);
      if (stat.isDirectory) {
        return { ok: true, path: resolvedPath };
      }
    } catch {
      return { ok: false, error: `Local path does not exist: ${options.source}` };
    }
  }

  const repoInfo = parseGitHubRepo(options.source);
  if (!repoInfo) {
    return { ok: false, error: "Invalid GitHub repository format" };
  }

  const skillSlug = options.skillName || repoInfo.repo;
  const targetDir = options.targetDir || `${home}/.skills/${repoInfo.owner}/${skillSlug}`;

  try {
    await ensureDir(targetDir);

    // Fetch latest commit SHA
    const commitSha = await fetchLatestGitHubCommit(options.source, options.token);

    // Try fetching SKILL.md from common default branches (main, master)
    const branches = ["main", "master"];
    let skillContent: string | null = null;

    const headers: Record<string, string> = {
      "User-Agent": "Skillet-Desktop-App",
    };
    if (options.token) {
      headers["Authorization"] = `token ${options.token}`;
    }

    for (const branch of branches) {
      try {
        const rawUrl = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${branch}/SKILL.md`;
        const res = await fetch(rawUrl, { headers });
        if (res.ok) {
          skillContent = await res.text();
          break;
        }
      } catch {
        // Try next branch
      }
    }

    // If SKILL.md was found, write it to disk
    if (skillContent) {
      const skillMdPath = `${targetDir}/SKILL.md`;
      await ensureParentDir(skillMdPath);
      await Deno.writeTextFile(skillMdPath, skillContent);
    } else {
      // If no SKILL.md found on root, create a default template so the skill is recognized
      const defaultSkillMd = `---
name: ${skillSlug}
description: Skill installed from ${repoInfo.owner}/${repoInfo.repo}
source_url: https://github.com/${repoInfo.owner}/${repoInfo.repo}
---

# ${skillSlug}

Installed from https://github.com/${repoInfo.owner}/${repoInfo.repo}
`;
      const skillMdPath = `${targetDir}/SKILL.md`;
      await ensureParentDir(skillMdPath);
      await Deno.writeTextFile(skillMdPath, defaultSkillMd);
    }

    // Update skills-lock.json
    try {
      const lock = await loadSkillsLock();
      const pkgKey = `${repoInfo.owner}/${repoInfo.repo}`;
      lock[pkgKey] = {
        source: options.source,
        commitSha: commitSha || "initial",
        updatedAt: new Date().toISOString(),
        skills: [skillSlug],
      };
      await saveSkillsLock(lock);
    } catch {
      // Non-fatal lockfile update error
    }

    return { ok: true, path: targetDir };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

/**
 * Uninstalls a skill from the local filesystem.
 */
export async function uninstallSkill(
  skillPath: string
): Promise<UninstallResult> {
  try {
    await Deno.remove(skillPath, { recursive: true });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
