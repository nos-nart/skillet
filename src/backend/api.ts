import { scanDirectoryForSkills } from "./scanner.ts";
import {
  enableSkillInWorkspace,
  disableSkillInWorkspace,
  isSkillEnabledInWorkspace,
} from "./symlinker.ts";
import { checkSkillUpdates } from "./updater.ts";
import { downloadSkillFromGitHub, uninstallSkill, InstallSkillOptions } from "./installer.ts";
import { WorkspaceManager } from "./workspace.ts";
import { Skill, Workspace, SkillToggleRequest } from "../types/skills.ts";
import { SUPPORTED_AGENTS, getAgentGlobalPath } from "./agents.ts";

const homeDir = Deno.env.get("HOME") || "/tmp";
const workspaceManager = new WorkspaceManager();

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  try {
    // GET /api/skills
    if (url.pathname === "/api/skills" && req.method === "GET") {
      const allSkills: Skill[] = [];
      const workspaces = await workspaceManager.getWorkspaces();

      for (const agent of SUPPORTED_AGENTS) {
        const globalPath = getAgentGlobalPath(agent.id, homeDir);
        const agentSkills = await scanDirectoryForSkills(globalPath, "global", agent.id);
        allSkills.push(...agentSkills);
      }

      // Check which workspaces have each skill enabled
      for (const skill of allSkills) {
        const enabledWorkspaces: string[] = [];
        for (const ws of workspaces) {
          if (ws.id === "global") continue;
          const enabled = await isSkillEnabledInWorkspace(skill.slug, ws.path, skill.agent);
          if (enabled) {
            enabledWorkspaces.push(ws.id);
          }
        }
        skill.enabledInWorkspaces = enabledWorkspaces;
      }

      return Response.json({ skills: allSkills });
    }

    // DELETE /api/skills (Uninstall skill)
    if (url.pathname === "/api/skills" && req.method === "DELETE") {
      const body = (await req.json().catch(() => ({}))) as { path?: string };
      const skillPath = body.path || url.searchParams.get("path");
      if (skillPath) {
        const result = await uninstallSkill(skillPath);
        return Response.json(result);
      }
      return Response.json({ success: false, error: "Missing skill path" }, { status: 400 });
    }

    // GET /api/agents
    if (url.pathname === "/api/agents" && req.method === "GET") {
      return Response.json({ agents: SUPPORTED_AGENTS });
    }

    // GET /api/workspaces
    if (url.pathname === "/api/workspaces" && req.method === "GET") {
      const workspaces = await workspaceManager.getWorkspaces();
      return Response.json({ workspaces });
    }

    // POST /api/workspaces
    if (url.pathname === "/api/workspaces" && req.method === "POST") {
      const ws = (await req.json()) as Workspace;
      await workspaceManager.addWorkspace(ws);
      return Response.json({ success: true });
    }

    // DELETE /api/workspaces
    if (url.pathname === "/api/workspaces" && req.method === "DELETE") {
      const body = (await req.json().catch(() => ({}))) as { id?: string };
      const id = body.id || url.searchParams.get("id");
      if (id) {
        await workspaceManager.removeWorkspace(id);
        return Response.json({ success: true });
      }
      return Response.json({ success: false, error: "Missing workspace id" }, { status: 400 });
    }

    // POST /api/toggle
    if (url.pathname === "/api/toggle" && req.method === "POST") {
      const { skillSlug, sourcePath, workspacePath, agent, enable } =
        (await req.json()) as SkillToggleRequest;

      let success = false;
      if (enable) {
        success = await enableSkillInWorkspace(
          sourcePath,
          skillSlug,
          workspacePath,
          agent
        );
      } else {
        success = await disableSkillInWorkspace(
          skillSlug,
          workspacePath,
          agent
        );
      }
      return Response.json({ success });
    }

    // POST /api/check-updates
    if (url.pathname === "/api/check-updates" && (req.method === "POST" || req.method === "GET")) {
      let skills: Skill[] = [];
      let token: string | undefined;

      if (req.method === "POST") {
        const body = (await req.json().catch(() => ({}))) as {
          skills?: Skill[];
          token?: string;
        };
        skills = body.skills || [];
        token = body.token;
      }

      const updates = await checkSkillUpdates(skills, undefined, token);
      return Response.json({ updates });
    }

    // POST /api/install
    if (url.pathname === "/api/install" && req.method === "POST") {
      const options = (await req.json()) as InstallSkillOptions;
      const result = await downloadSkillFromGitHub(options);
      return Response.json(result);
    }

    return new Response("Not Found", { status: 404 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: errorMsg }, { status: 500 });
  }
}
