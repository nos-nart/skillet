import { AgentId } from "../types/skills.ts";

export function getAgentRelPath(agent: AgentId): string {
  switch (agent) {
    case "cursor":
      return ".cursor/skills";
    case "claude-code":
      return ".claude/skills";
    case "gemini":
    case "antigravity":
      return ".gemini/config/skills";
    case "windsurf":
      return ".windsurf/skills";
    case "copilot":
      return ".github/skills";
    case "codex":
      return ".codex/skills";
    case "opencode":
      return ".opencode/skills";
    default:
      return ".skills";
  }
}

export async function isSkillEnabledInWorkspace(
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const targetDir = `${workspacePath}/${getAgentRelPath(agent)}/${skillSlug}`;
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
  const agentDir = `${workspacePath}/${getAgentRelPath(agent)}`;
  const targetSymlink = `${agentDir}/${skillSlug}`;

  try {
    await Deno.mkdir(agentDir, { recursive: true });
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
  const targetSymlink = `${workspacePath}/${getAgentRelPath(agent)}/${skillSlug}`;
  try {
    await Deno.remove(targetSymlink, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
