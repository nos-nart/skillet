import { AgentId } from "../types/skills.ts";

export interface AgentConfig {
  id: AgentId;
  name: string;
  globalDirName: string; // e.g. ".claude/skills"
  localRelPath: string;  // e.g. ".claude/skills"
  status: "Active" | "Ready";
}

export const SUPPORTED_AGENTS: AgentConfig[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    globalDirName: ".claude/skills",
    localRelPath: ".claude/skills",
    status: "Active",
  },
  {
    id: "cursor",
    name: "Cursor",
    globalDirName: ".cursor/skills",
    localRelPath: ".cursor/skills",
    status: "Active",
  },
  {
    id: "gemini",
    name: "Gemini",
    globalDirName: ".gemini/config/skills",
    localRelPath: ".gemini/skills",
    status: "Active",
  },
  {
    id: "antigravity",
    name: "Antigravity",
    globalDirName: ".gemini/config/skills",
    localRelPath: ".gemini/skills",
    status: "Active",
  },
  {
    id: "generic",
    name: "Generic Open Skills",
    globalDirName: ".skills",
    localRelPath: ".skills",
    status: "Active",
  },
  {
    id: "windsurf",
    name: "Windsurf",
    globalDirName: ".codeium/windsurf/skills",
    localRelPath: ".windsurf/skills",
    status: "Ready",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    globalDirName: ".github/skills",
    localRelPath: ".github/skills",
    status: "Ready",
  },
  {
    id: "opencode",
    name: "OpenCode",
    globalDirName: ".opencode/skills",
    localRelPath: ".opencode/skills",
    status: "Ready",
  },
];

export function getAgentConfig(agentId: AgentId): AgentConfig | undefined {
  return SUPPORTED_AGENTS.find((a) => a.id === agentId);
}

export function getAgentRelPath(_agentId: AgentId): string {
  // Always use the universal .skills directory in the project workspace
  return ".skills";
}

export function getAgentGlobalPath(agentId: AgentId, homeDir: string): string {
  const config = getAgentConfig(agentId);
  return config ? `${homeDir}/${config.globalDirName}` : `${homeDir}/.skills`;
}
