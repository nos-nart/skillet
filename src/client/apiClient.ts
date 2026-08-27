import { Skill, Workspace, SkillToggleRequest } from "../types/skills.ts";
import { AgentConfig } from "../backend/agents.ts";
import { InstallResult, UninstallResult } from "../backend/installer.ts";

export const api = {
  async getSkills(): Promise<Skill[]> {
    const res = await fetch("/api/skills");
    if (!res.ok) throw new Error("Failed to fetch skills");
    const data = await res.json();
    return data.skills;
  },

  async getAgents(): Promise<AgentConfig[]> {
    const res = await fetch("/api/agents");
    if (!res.ok) throw new Error("Failed to fetch agents");
    const data = await res.json();
    return data.agents;
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
};
