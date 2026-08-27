export type AgentId =
  | "claude-code"
  | "cursor"
  | "gemini"
  | "antigravity"
  | "windsurf"
  | "opencode"
  | "codex"
  | "copilot"
  | "general";

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  trigger?: string;
  tools?: string[];
  agents?: AgentId[];
  license?: string;
}

export interface Skill {
  id: string; // e.g. "cursor-plugins/architect"
  name: string;
  slug: string; // e.g. "architect"
  packageName: string; // e.g. "cursor/plugins"
  scope: "global" | "project";
  agent: AgentId;
  path: string; // absolute path to folder containing SKILL.md
  skillMdPath: string;
  metadata: SkillMetadata;
  rawMarkdown: string;
  isSymlink: boolean;
  targetPath?: string;
  updateAvailable?: boolean;
}

export interface SkillPackage {
  name: string; // e.g. "cursor/plugins", "vercel-labs/skills"
  author: string;
  sourceUrl?: string;
  skills: Skill[];
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
}
