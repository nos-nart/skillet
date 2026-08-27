import { Skill, Workspace, AgentId } from "../types/skills.ts";

export const api = {
  async getSkills(): Promise<Skill[]> {
    const res = await fetch("/api/skills");
    if (!res.ok) throw new Error("Failed to fetch skills");
    const data = await res.json();
    return data.skills;
  },

  async getWorkspaces(): Promise<Workspace[]> {
    const res = await fetch("/api/workspaces");
    if (!res.ok) throw new Error("Failed to fetch workspaces");
    const data = await res.json();
    return data.workspaces;
  },

  async addWorkspace(ws: Workspace): Promise<boolean> {
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ws),
    });
    if (!res.ok) throw new Error("Failed to add workspace");
    const data = await res.json();
    return data.success;
  },

  async removeWorkspace(id: string): Promise<boolean> {
    const res = await fetch("/api/workspaces", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error("Failed to remove workspace");
    const data = await res.json();
    return data.success;
  },

  async toggleSkill(params: {
    skillSlug: string;
    sourcePath: string;
    workspacePath: string;
    agent: AgentId | string;
    enable: boolean;
  }): Promise<boolean> {
    const res = await fetch("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error("Failed to toggle skill");
    const data = await res.json();
    return data.success;
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

  async checkForUpdates(
    skills?: Skill[],
    token?: string
  ): Promise<Record<string, boolean>> {
    return this.checkUpdates(skills, token);
  },

  async installSkill(options: {
    source: string;
    skillName?: string;
    targetDir?: string;
  }): Promise<{ success: boolean; path?: string; error?: string }> {
    const res = await fetch("/api/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error("Failed to install skill");
    const data = await res.json();
    return data;
  },
};
