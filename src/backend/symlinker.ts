import { AgentId } from "../types/skills.ts";
import { getAgentRelPath } from "./agents.ts";
import { ensureDir } from "./fs.ts";

export { getAgentRelPath };

/**
 * Validates that a skill slug does not contain directory traversal sequences
 * or illegal characters that could escape the intended target directory.
 */
export function validateSafeSlug(slug: string): boolean {
  if (!slug) return false;
  const trimmed = slug.trim();
  if (trimmed === "" || trimmed === "." || trimmed === "..") return false;
  if (trimmed.includes("..") || trimmed.includes("/") || trimmed.includes("\\") || trimmed.includes("\0")) {
    return false;
  }
  // Allow letters, numbers, hyphens, underscores, dots
  return /^[a-zA-Z0-9_.-]+$/.test(trimmed);
}

function resolveSafeTarget(workspacePath: string, agent: AgentId, skillSlug: string): string | null {
  if (!validateSafeSlug(skillSlug)) {
    return null;
  }
  const normalizedWs = workspacePath.replace(/\/+$/, "");
  const target = `${normalizedWs}/${getAgentRelPath(agent)}/${skillSlug}`;

  // Ensure resolved path doesn't escape workspace
  if (!target.startsWith(normalizedWs)) {
    return null;
  }
  return target;
}

export async function isSkillEnabledInWorkspace(
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const targetDir = resolveSafeTarget(workspacePath, agent, skillSlug);
  if (!targetDir) return false;

  try {
    const stat = await Deno.lstat(targetDir);
    return stat.isSymlink || stat.isDirectory;
  } catch {
    return false;
  }
}

export async function enableSkillInWorkspace(
  sourceSkillPath: string,
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const targetSymlink = resolveSafeTarget(workspacePath, agent, skillSlug);
  if (!targetSymlink) {
    console.error(`Invalid skill slug or path traversal attempt: ${skillSlug}`);
    return false;
  }

  const skillsDir = `${workspacePath.replace(/\/+$/, "")}/${getAgentRelPath(agent)}`;

  try {
    await ensureDir(skillsDir);
    // Remove if already exists to ensure clean symlink creation
    try {
      await Deno.remove(targetSymlink, { recursive: true });
    } catch {
      // Ignore if target does not exist
    }
    await Deno.symlink(sourceSkillPath, targetSymlink);
    return true;
  } catch (err) {
    console.error(`Failed to enable skill ${skillSlug} in workspace:`, err);
    return false;
  }
}

export async function disableSkillInWorkspace(
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const targetSymlink = resolveSafeTarget(workspacePath, agent, skillSlug);
  if (!targetSymlink) return false;

  try {
    await Deno.remove(targetSymlink, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
