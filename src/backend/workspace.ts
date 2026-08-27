import { Workspace } from "../types/skills.ts";
import { ensureParentDir } from "./fs.ts";

export class WorkspaceManager {
  private customConfigPath?: string;
  private inMemoryList?: Workspace[];

  constructor(customConfigPath?: string) {
    this.customConfigPath = customConfigPath;
  }

  private getConfigPath(): string {
    const custom = this.customConfigPath || Deno.env.get("SKILLET_CONFIG_PATH");
    const home = Deno.env.get("HOME") || "/tmp";
    return custom || `${home}/.config/skillet/workspaces.json`;
  }

  async getWorkspaces(): Promise<Workspace[]> {
    if (this.inMemoryList) {
      return this.inMemoryList;
    }
    try {
      const data = await Deno.readTextFile(this.getConfigPath());
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
    this.inMemoryList = [...list];
    try {
      const targetPath = this.getConfigPath();
      await ensureParentDir(targetPath);
      await Deno.writeTextFile(targetPath, JSON.stringify(list, null, 2));
    } catch {
      // Retain in-memory list if filesystem is not writable
    }
  }
}
