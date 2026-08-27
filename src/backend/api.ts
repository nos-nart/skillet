import { scanDirectoryForSkills } from "./scanner.ts";
import {
  enableSkillInWorkspace,
  disableSkillInWorkspace,
  isSkillEnabledInWorkspace,
} from "./symlinker.ts";
import { checkSkillUpdates } from "./updater.ts";
import { downloadSkillFromGitHub, uninstallSkill, InstallSkillOptions } from "./installer.ts";
import { WorkspaceManager } from "./workspace.ts";
import { Skill, Workspace, SkillToggleRequest, AgentId } from "../types/skills.ts";
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
      const body = (await req.json().catch(() => ({}))) as { path?: unknown };
      const skillPath = typeof body.path === "string" ? body.path : url.searchParams.get("path");
      if (!skillPath || !skillPath.trim()) {
        return Response.json({ ok: false, error: "Missing required 'path' parameter" }, { status: 400 });
      }

      const result = await uninstallSkill(skillPath.trim());
      return Response.json(result, { status: result.ok ? 200 : 500 });
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
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object" || !body.id || !body.name || !body.path) {
        return Response.json(
          { ok: false, error: "Invalid workspace payload. 'id', 'name', and 'path' are required." },
          { status: 400 }
        );
      }
      const ws: Workspace = {
        id: String(body.id),
        name: String(body.name),
        path: String(body.path),
        isCurrent: Boolean(body.isCurrent),
      };
      await workspaceManager.addWorkspace(ws);
      return Response.json({ ok: true });
    }

    // DELETE /api/workspaces
    if (url.pathname === "/api/workspaces" && req.method === "DELETE") {
      const body = (await req.json().catch(() => ({}))) as { id?: unknown };
      const id = typeof body.id === "string" ? body.id : url.searchParams.get("id");
      if (!id || !id.trim()) {
        return Response.json({ ok: false, error: "Missing required 'id' parameter" }, { status: 400 });
      }
      await workspaceManager.removeWorkspace(id.trim());
      return Response.json({ ok: true });
    }

    // POST /api/toggle
    if (url.pathname === "/api/toggle" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (
        !body ||
        typeof body !== "object" ||
        typeof body.skillSlug !== "string" ||
        typeof body.sourcePath !== "string" ||
        typeof body.workspacePath !== "string" ||
        typeof body.agent !== "string" ||
        typeof body.enable !== "boolean"
      ) {
        return Response.json(
          {
            ok: false,
            error: "Invalid toggle payload. 'skillSlug', 'sourcePath', 'workspacePath', 'agent', and 'enable' (boolean) are required.",
          },
          { status: 400 }
        );
      }

      const { skillSlug, sourcePath, workspacePath, agent, enable } = body as SkillToggleRequest;

      let success = false;
      if (enable) {
        success = await enableSkillInWorkspace(
          sourcePath,
          skillSlug,
          workspacePath,
          agent as AgentId
        );
      } else {
        success = await disableSkillInWorkspace(
          skillSlug,
          workspacePath,
          agent as AgentId
        );
      }
      return Response.json({ ok: success });
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
        skills = Array.isArray(body.skills) ? body.skills : [];
        token = typeof body.token === "string" ? body.token : undefined;
      }

      const updates = await checkSkillUpdates(skills, undefined, token);
      return Response.json({ updates });
    }

    // POST /api/install
    if (url.pathname === "/api/install" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== "object" || typeof body.source !== "string" || !body.source.trim()) {
        return Response.json(
          { ok: false, error: "Invalid install payload. 'source' (GitHub repo or local path) is required." },
          { status: 400 }
        );
      }

      const options: InstallSkillOptions = {
        source: body.source.trim(),
        skillName: typeof body.skillName === "string" ? body.skillName.trim() : undefined,
        targetDir: typeof body.targetDir === "string" ? body.targetDir.trim() : undefined,
        token: typeof body.token === "string" ? body.token.trim() : undefined,
      };

      const result = await downloadSkillFromGitHub(options);
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }

    return new Response("Not Found", { status: 404 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
