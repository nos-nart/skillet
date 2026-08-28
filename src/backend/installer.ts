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


  // Check if source is a Gist URL
  if (options.source.includes("gist.github.com/")) {
    return downloadGistSkill(options, home);
  }

  const repoInfo = parseGitHubRepo(options.source);
  if (!repoInfo) {
    return { ok: false, error: "Invalid GitHub repository format" };
  }

  // Intelligently determine the best global directory based on owner/repo name
  let globalDir = ".skills";
  const repoStr = `${repoInfo.owner}/${repoInfo.repo}`.toLowerCase();
  if (repoStr.includes("cursor")) globalDir = ".cursor/skills";
  else if (repoStr.includes("gemini") || repoStr.includes("antigravity")) globalDir = ".gemini/config/skills";
  else if (repoStr.includes("claude")) globalDir = ".claude/skills";
  else if (repoStr.includes("windsurf")) globalDir = ".codeium/windsurf/skills";
  else if (repoStr.includes("copilot")) globalDir = ".github/skills";

  // Use explicit skillName, or the subdirectory name, or the repo name
  const pathParts = repoInfo.path?.split("/").filter(Boolean) || [];
  const skillSlug = options.skillName || pathParts.pop() || repoInfo.repo;
  const targetDir = options.targetDir || `${home}/${globalDir}/${repoInfo.owner}/${skillSlug}`;
  
  const repoUrl = `${repoInfo.owner}/${repoInfo.repo}${repoInfo.path ? `/tree/main/${repoInfo.path}` : ""}`;

  try {
    await ensureDir(targetDir);

    // Fetch latest commit SHA
    const commitSha = await fetchLatestGitHubCommit(options.source, options.token);

    // Try fetching SKILL.md from common default branches (main, master)
    const branches = ["main", "master"];
    let skillContent: string | null = null;

    const headers = new Headers({
      "User-Agent": "Skillet-Desktop-App",
    });
    if (options.token) {
      headers.set("Authorization", `token ${options.token}`);
    }

    for (const branch of branches) {
      try {
        // Build URL, appending path if present
        const subpath = repoInfo.path ? `/${repoInfo.path}` : "";
        const rawUrl = `https://raw.githubusercontent.com/${repoInfo.owner}/${repoInfo.repo}/${branch}${subpath}/SKILL.md`;
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
      // Create a default SKILL.md template so the skill is discoverable
      const defaultSkillMd = `---
name: ${skillSlug}
description: Skill installed from ${repoUrl}
source_url: https://github.com/${repoUrl}
---

# ${skillSlug}

Installed from https://github.com/${repoUrl}
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
 * Uninstalls a skill from the local filesystem and cleans up any real directory if symlinked.
 */
export async function uninstallSkill(
  skillPath: string
): Promise<UninstallResult> {
  try {
    try {
      const lstat = await Deno.lstat(skillPath);
      if (lstat.isSymlink) {
        const real = await Deno.realPath(skillPath);
        await Deno.remove(skillPath);
        if (real && real !== skillPath) {
          await Deno.remove(real, { recursive: true }).catch(() => {});
        }
        return { ok: true };
      }
    } catch {
      // Non-fatal lstat check
    }

    await Deno.remove(skillPath, { recursive: true });
    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

async function downloadGistSkill(
  options: InstallSkillOptions,
  home: string
): Promise<InstallResult> {
  const gistId = options.source.split("/").pop();
  if (!gistId) return { ok: false, error: "Invalid Gist URL" };
  
  try {
    const headers = new Headers({ "User-Agent": "Skillet-Desktop-App" });
    if (options.token) headers.set("Authorization", `token ${options.token}`);
    
    const res = await fetch(`https://api.github.com/gists/${gistId}`, { headers });
    if (!res.ok) throw new Error("Failed to fetch Gist");
    const gistData = await res.json();
    
    const owner = gistData.owner?.login || "gist";
    let globalDir = ".skills";
    let installedCount = 0;
    
    const mdFiles = Object.keys(gistData.files).filter(f => f.endsWith(".md"));
    
    for (const [filename, fileData] of Object.entries(gistData.files)) {
      if (!filename.endsWith(".md")) continue;
      
      let skillSlug = filename.replace(/\.md$/, "");
      if (options.skillName && (filename === "SKILL.md" || mdFiles.length === 1)) {
         skillSlug = options.skillName;
      }
      
      const targetDir = options.targetDir || `${home}/${globalDir}/${owner}/${skillSlug}`;
      await ensureDir(targetDir);
      
      const skillMdPath = `${targetDir}/SKILL.md`;
      await ensureParentDir(skillMdPath);
      // SAFETY: The GitHub Gist API response for file objects contains a `content` property
      await Deno.writeTextFile(skillMdPath, (fileData as any).content || "");
      
      installedCount++;
    }
    
    if (installedCount === 0) {
       return { ok: false, error: "No .md files found in this Gist" };
    }
    
    return { ok: true, path: `${home}/${globalDir}/${owner}` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

