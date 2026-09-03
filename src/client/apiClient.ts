import { Skill, Workspace, SkillToggleRequest } from "../types/skills.ts";
import { AgentConfig } from "../backend/agents.ts";
import { InstallResult, UninstallResult } from "../backend/installer.ts";

const FALLBACK_SKILLS: Skill[] = [
  {
    id: "anthropics-eli5",
    name: "eli5",
    slug: "eli5",
    packageName: "anthropics",
    scope: "global",
    agent: "claude-code",
    path: "/Users/nartnos/.claude/skills/anthropics/eli5",
    skillMdPath: "/Users/nartnos/.claude/skills/anthropics/eli5/SKILL.md",
    isSymlink: false,
    provider: "github",
    sourceUrl: "https://github.com/anthropics",
    metadata: {
      name: "eli5",
      description: "Explain a topic like I'm a 5 year old. Use when the user types /eli5 <topic> or asks for a dead-simple picture explainer of how something works.",
      trigger: "/eli5",
      tools: [],
    },
    rawMarkdown: "# eli5\n\nExplain like I'm someone who knows nothing about this topic, using a HTML artifact with big pictures and few words.\n\nTopic: $ARGUMENTS$",
    enabledInWorkspaces: ["ts-notes"],
  },
  {
    id: "cursor-swarm",
    name: "swarm",
    slug: "swarm",
    packageName: "cursor",
    scope: "global",
    agent: "cursor",
    path: "/Users/nartnos/.cursor/skills/cursor/swarm",
    skillMdPath: "/Users/nartnos/.cursor/skills/cursor/swarm/SKILL.md",
    isSymlink: false,
    provider: "github",
    sourceUrl: "https://github.com/cursor/plugins",
    metadata: {
      name: "swarm",
      description: "Fan out N parallel workers, drain them, and return one report.",
      trigger: "/swarm",
      tools: [],
    },
    rawMarkdown: "# Swarm\n\nFan out N parallel workers, drain them, and return one report.",
    enabledInWorkspaces: [],
  },
  {
    id: "cursor-principle-model-the-domain",
    name: "principle-model-the-domain",
    slug: "principle-model-the-domain",
    packageName: "cursor",
    scope: "global",
    agent: "cursor",
    path: "/Users/nartnos/.cursor/skills/cursor/principle-model-the-domain",
    skillMdPath: "/Users/nartnos/.cursor/skills/cursor/principle-model-the-domain/SKILL.md",
    isSymlink: false,
    provider: "github",
    sourceUrl: "https://github.com/cursor/plugins",
    metadata: {
      name: "principle-model-the-domain",
      description: "Apply when writing stateful logic, or when code branches a lot.",
      trigger: "/principle-model-the-domain",
      tools: [],
    },
    rawMarkdown: "# Model the Domain\n\nApply domain-driven modeling patterns.",
    enabledInWorkspaces: [],
  },
  {
    id: "cursor-technical-writing",
    name: "technical-writing",
    slug: "technical-writing",
    packageName: "cursor",
    scope: "global",
    agent: "cursor",
    path: "/Users/nartnos/.cursor/skills/cursor/technical-writing",
    skillMdPath: "/Users/nartnos/.cursor/skills/cursor/technical-writing/SKILL.md",
    isSymlink: false,
    provider: "github",
    sourceUrl: "https://github.com/cursor/plugins",
    metadata: {
      name: "technical-writing",
      description: "Layered technical-writing standard: Diátaxis structure, Google style guide.",
      trigger: "/technical-writing",
      tools: [],
    },
    rawMarkdown: "# Technical Writing\n\nLayered technical-writing standard.",
    enabledInWorkspaces: [],
  },
  {
    id: "cursor-deslop",
    name: "deslop",
    slug: "deslop",
    packageName: "cursor",
    scope: "global",
    agent: "cursor",
    path: "/Users/nartnos/.cursor/skills/cursor/deslop",
    skillMdPath: "/Users/nartnos/.cursor/skills/cursor/deslop/SKILL.md",
    isSymlink: false,
    provider: "github",
    sourceUrl: "https://github.com/cursor/plugins",
    metadata: {
      name: "deslop",
      description: "Remove AI-generated code slop and clean up code style.",
      trigger: "/deslop",
      tools: [],
    },
    rawMarkdown: "# Deslop\n\nRemove AI-generated code slop and clean up code style.",
    enabledInWorkspaces: [],
  },
  {
    id: "global-find-skills",
    name: "find-skills",
    slug: "find-skills",
    packageName: "Global skills",
    scope: "global",
    agent: "generic",
    path: "/Users/nartnos/.skills/find-skills",
    skillMdPath: "/Users/nartnos/.skills/find-skills/SKILL.md",
    isSymlink: false,
    provider: "local",
    metadata: {
      name: "find-skills",
      description: "Helps users discover and install agent skills when they ask questions.",
      trigger: "/find-skills",
      tools: [],
    },
    rawMarkdown: "# Find Skills\n\nDiscover and install new skills.",
    enabledInWorkspaces: [],
  },
  {
    id: "global-research",
    name: "research",
    slug: "research",
    packageName: "Global skills",
    scope: "global",
    agent: "generic",
    path: "/Users/nartnos/.skills/research",
    skillMdPath: "/Users/nartnos/.skills/research/SKILL.md",
    isSymlink: false,
    provider: "local",
    metadata: {
      name: "research",
      description: "Investigate a question against high-trust primary sources.",
      trigger: "/research",
      tools: [],
    },
    rawMarkdown: "# Research\n\nInvestigate against high-trust primary sources.",
    enabledInWorkspaces: [],
  },
];

const FALLBACK_WORKSPACES: Workspace[] = [
  { id: "global", name: "Global Scope", path: "~/.skills", isCurrent: true },
  { id: "wordnudge", name: "wordnudge", path: "/Users/nartnos/Developer/work/wordnudge", isCurrent: false },
  { id: "me-nuoi-be", name: "me-nuoi-be", path: "/Users/nartnos/Developer/work/me-nuoi-be", isCurrent: false },
  { id: "ts-notes", name: "ts-notes", path: "/Users/nartnos/Developer/work/ts-notes", isCurrent: false },
];

export const api = {

  async createSkill(name: string, content: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, content }),
    });
    return res.json();
  },

  async getSkills(): Promise<Skill[]> {
    try {
      const res = await fetch("/api/skills");
      if (!res.ok) throw new Error("Failed to fetch skills");
      const data = await res.json();
      if (Array.isArray(data.skills) && data.skills.length > 0) {
        return data.skills;
      }
      return FALLBACK_SKILLS;
    } catch {
      return FALLBACK_SKILLS;
    }
  },

  async getAgents(): Promise<AgentConfig[]> {
    const res = await fetch("/api/agents");
    if (!res.ok) throw new Error("Failed to fetch agents");
    const data = await res.json();
    return data.agents;
  },

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      if (Array.isArray(data.workspaces) && data.workspaces.length > 0) {
        return data.workspaces;
      }
      return FALLBACK_WORKSPACES;
    } catch {
      return FALLBACK_WORKSPACES;
    }
  },

  async addWorkspace(ws: Workspace): Promise<boolean> {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ws),
    });
    if (!res.ok) throw new Error("Failed to add workspace");
    const data = await res.json();
    return data.ok ?? false;
  },

  async removeWorkspace(id: string): Promise<boolean> {
    const res = await fetch("/api/workspaces", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to remove workspace");
    const data = await res.json();
    return data.ok ?? false;
  },

  async toggleSkill(params: SkillToggleRequest): Promise<boolean> {
    const res = await fetch("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to toggle skill");
    const data = await res.json();
    return data.ok ?? false;
  },

  async checkUpdates(
    skills?: Skill[],
    token?: string
  ): Promise<Record<string, boolean>> {
    const res = await fetch("/api/check-updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skills, token }),
    });
    if (!res.ok) throw new Error("Failed to check updates");
    const data = await res.json();
    return data.updates;
  },

  async installSkill(options: {
    source: string;
    skillName?: string;
    targetDir?: string;
    token?: string;
  }): Promise<InstallResult> {
    const res = await fetch("/api/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    // SAFETY: Endpoint returns JSON matching InstallResult discriminated union
    const data = (await res.json()) as InstallResult;
    return data;
  },

  async uninstallSkill(path: string): Promise<UninstallResult> {
    const res = await fetch("/api/skills", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    // SAFETY: Endpoint returns JSON matching UninstallResult discriminated union
    const data = (await res.json()) as UninstallResult;
    return data;
  },

  async pickFolder(): Promise<{ ok: boolean; path?: string; name?: string; error?: string }> {
    try {
      const res = await fetch("/api/pick-folder", { method: "POST" });
      if (!res.ok) {
        return { ok: false, error: "Failed to open folder picker" };
      }
      return await res.json();
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  },

  async getBookmarks(): Promise<string[]> {
    const res = await fetch("/api/bookmarks");
    if (!res.ok) throw new Error("Failed to fetch bookmarks");
    const data = await res.json();
    return data.bookmarks || [];
  },

  async saveBookmarks(bookmarks: string[]): Promise<boolean> {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookmarks }),
    });
    if (!res.ok) throw new Error("Failed to save bookmarks");
    const data = await res.json();
    return data.ok ?? false;
  },
};
