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

interface RawPayload {
  path?: any;
  id?: any;
  name?: any;
  isCurrent?: any;
  source?: any;
  skillName?: any;
  targetDir?: any;
  token?: any;
  skills?: any;
  skillSlug?: any;
  sourcePath?: any;
  workspacePath?: any;
  agent?: any;
  enable?: any;
}

function isString(val: any): val is string {
  return typeof val === "string";
}

function isBoolean(val: any): val is boolean {
  return typeof val === "boolean";
}

function isObject(val: any): val is RawPayload {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function parseToggleRequest(raw: RawPayload): SkillToggleRequest | null {
  if (
    !isString(raw.skillSlug) || !raw.skillSlug.trim() ||
    !isString(raw.sourcePath) || !raw.sourcePath.trim() ||
    !isString(raw.workspacePath) || !raw.workspacePath.trim() ||
    !isString(raw.agent) || !raw.agent.trim() ||
    !isBoolean(raw.enable)
  ) {
    return null;
  }
  return {
    skillSlug: raw.skillSlug.trim(),
    sourcePath: raw.sourcePath.trim(),
    workspacePath: raw.workspacePath.trim(),
    // SAFETY: Verified non-empty string matches supported AgentId
    agent: raw.agent.trim() as AgentId,
    enable: raw.enable,
  };
}

function parseInstallRequest(raw: RawPayload): InstallSkillOptions | null {
  if (!isString(raw.source) || !raw.source.trim()) {
    return null;
  }
  return {
    source: raw.source.trim(),
    skillName: isString(raw.skillName) ? raw.skillName.trim() : undefined,
    targetDir: isString(raw.targetDir) ? raw.targetDir.trim() : undefined,
    token: isString(raw.token) ? raw.token.trim() : undefined,
  };
}

function parseWorkspaceRequest(raw: RawPayload): Workspace | null {
  if (
    !isString(raw.id) || !raw.id.trim() ||
    !isString(raw.name) || !raw.name.trim() ||
    !isString(raw.path) || !raw.path.trim()
  ) {
    return null;
  }
  return {
    id: raw.id.trim(),
    name: raw.name.trim(),
    path: raw.path.trim(),
    isCurrent: Boolean(raw.isCurrent),
  };
}

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
      const body = await req.json().catch(() => null);
      const raw: RawPayload = isObject(body) ? body : {};
      const skillPath = isString(raw.path) ? raw.path : url.searchParams.get("path");
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
      if (!isObject(body)) {
        return Response.json(
          { ok: false, error: "Invalid workspace payload. JSON object expected." },
          { status: 400 }
        );
      }
      const ws = parseWorkspaceRequest(body);
      if (!ws) {
        return Response.json(
          { ok: false, error: "Invalid workspace payload. 'id', 'name', and 'path' are required." },
          { status: 400 }
        );
      }
      await workspaceManager.addWorkspace(ws);
      return Response.json({ ok: true });
    }

    // DELETE /api/workspaces
    if (url.pathname === "/api/workspaces" && req.method === "DELETE") {
      const body = await req.json().catch(() => null);
      const raw: RawPayload = isObject(body) ? body : {};
      const id = isString(raw.id) ? raw.id : url.searchParams.get("id");
      if (!id || !id.trim()) {
        return Response.json({ ok: false, error: "Missing required 'id' parameter" }, { status: 400 });
      }
      await workspaceManager.removeWorkspace(id.trim());
      return Response.json({ ok: true });
    }

    // POST /api/toggle
    if (url.pathname === "/api/toggle" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!isObject(body)) {
        return Response.json(
          { ok: false, error: "Invalid toggle payload. JSON object expected." },
          { status: 400 }
        );
      }
      const toggleReq = parseToggleRequest(body);
      if (!toggleReq) {
        return Response.json(
          {
            ok: false,
            error: "Invalid toggle payload. 'skillSlug', 'sourcePath', 'workspacePath', 'agent', and 'enable' (boolean) are required.",
          },
          { status: 400 }
        );
      }

      let success = false;
      if (toggleReq.enable) {
        success = await enableSkillInWorkspace(
          toggleReq.sourcePath,
          toggleReq.skillSlug,
          toggleReq.workspacePath,
          toggleReq.agent
        );
      } else {
        success = await disableSkillInWorkspace(
          toggleReq.skillSlug,
          toggleReq.workspacePath,
          toggleReq.agent
        );
      }
      return Response.json({ ok: success });
    }

    // POST /api/check-updates
    if (url.pathname === "/api/check-updates" && (req.method === "POST" || req.method === "GET")) {
      let skills: Skill[] = [];
      let token: string | undefined;

      if (req.method === "POST") {
        const body = await req.json().catch(() => null);
        const raw: RawPayload = isObject(body) ? body : {};
        // SAFETY: Downcasting checked array elements to Skill model
        skills = Array.isArray(raw.skills) ? (raw.skills as Skill[]) : [];
        token = isString(raw.token) ? raw.token.trim() : undefined;
      }

      const updates = await checkSkillUpdates(skills, undefined, token);
      return Response.json({ updates });
    }

    // POST /api/install
    if (url.pathname === "/api/install" && req.method === "POST") {
      const body = await req.json().catch(() => null);
      if (!isObject(body)) {
        return Response.json(
          { ok: false, error: "Invalid install payload. JSON object expected." },
          { status: 400 }
        );
      }
      const options = parseInstallRequest(body);
      if (!options) {
        return Response.json(
          { ok: false, error: "Invalid install payload. 'source' (GitHub repo or local path) is required." },
          { status: 400 }
        );
      }

      const result = await downloadSkillFromGitHub(options);
      return Response.json(result, { status: result.ok ? 200 : 400 });
    }

    // POST /api/pick-folder (Native macOS folder picker)
    if (url.pathname === "/api/pick-folder" && req.method === "POST") {
      try {
        const command = new Deno.Command("osascript", {
          args: ["-e", 'POSIX path of (choose folder with prompt "Select Project Folder")'],
        });
        const output = await command.output();
        if (output.success) {
          const rawPath = new TextDecoder().decode(output.stdout).trim().replace(/\/+$/, "");
          if (rawPath) {
            const folderName = rawPath.split("/").pop() || "Workspace";
            return Response.json({
              ok: true,
              path: rawPath,
              name: folderName,
            });
          }
        }
        return Response.json({ ok: false, error: "Folder selection was cancelled" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return Response.json({ ok: false, error: msg }, { status: 500 });
      }
    }

    return new Response("Not Found", { status: 404 });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return Response.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
