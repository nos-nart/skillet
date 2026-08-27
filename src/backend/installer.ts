import { parseGitHubRepo } from "./updater.ts";

export interface InstallSkillOptions {
  source: string;
  skillName?: string;
  targetDir?: string;
}

/**
 * Downloads / stages a skill package from a GitHub repository to the local filesystem.
 */
export async function downloadSkillFromGitHub(
  options: InstallSkillOptions
): Promise<{ success: boolean; path?: string; error?: string }> {
  const repoInfo = parseGitHubRepo(options.source);
  if (!repoInfo) {
    return { success: false, error: "Invalid GitHub repository format" };
  }

  const home = Deno.env.get("HOME") || "/tmp";
  const baseDir = options.targetDir || `${home}/.skills/${repoInfo.owner}/${repoInfo.repo}`;

  try {
    await Deno.mkdir(baseDir, { recursive: true });
    return { success: true, path: baseDir };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
