import { Workspace } from "../types/skills.ts";

export class WorkspaceManager {
  private configPath: string;

  constructor(customConfigPath?: string) {
    const home = Deno.env.get("HOME") || "/tmp";
    this.configPath = customConfigPath || `${home}/.config/skillet/workspaces.json`;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    try {
      const data = await Deno.readTextFile(this.configPath);
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fallback if file doesn't exist or is unparseable
    }

    return [
      {
        id: "global",
        name: "Global Scope",
        path: "~/.skills",
        isCurrent: true,
      },
    ];
  }

  async addWorkspace(ws: Workspace): Promise<void> {
    const list = await this.getWorkspaces();
    if (!list.some((w) => w.path === ws.path || w.id === ws.id)) {
      list.push(ws);
      await this.saveWorkspaces(list);
    }
  }

  async removeWorkspace(idOrPath: string): Promise<void> {
    const list = await this.getWorkspaces();
    const filtered = list.filter(
      (w) => w.id !== idOrPath && w.path !== idOrPath
    );
    if (filtered.length === 0) {
      filtered.push({
        id: "global",
        name: "Global Scope",
        path: "~/.skills",
        isCurrent: true,
      });
    }
    await this.saveWorkspaces(filtered);
  }

  async setCurrentWorkspace(id: string): Promise<void> {
    const list = await this.getWorkspaces();
    const updated = list.map((w) => ({
      ...w,
      isCurrent: w.id === id,
    }));
    await this.saveWorkspaces(updated);
  }

  private async saveWorkspaces(list: Workspace[]): Promise<void> {
    const lastSlash = this.configPath.lastIndexOf("/");
    if (lastSlash > 0) {
      const dir = this.configPath.substring(0, lastSlash);
      await Deno.mkdir(dir, { recursive: true });
    }
    await Deno.writeTextFile(this.configPath, JSON.stringify(list, null, 2));
  }
}
