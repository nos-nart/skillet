import { assertEquals, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleApiRequest } from "../src/backend/api.ts";
import { api } from "../src/client/apiClient.ts";
import { Workspace } from "../src/types/skills.ts";

Deno.test("handleApiRequest handles GET /api/skills", async () => {
  const req = new Request("http://localhost/api/skills");
  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data.skills), true);
});

Deno.test("handleApiRequest handles GET /api/workspaces", async () => {
  const req = new Request("http://localhost/api/workspaces");
  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data.workspaces), true);
  assertNotEquals(data.workspaces.length, 0);
});

Deno.test("handleApiRequest handles POST /api/workspaces", async () => {
  const customWs: Workspace = {
    id: "test-workspace-" + Date.now(),
    name: "Test Workspace",
    path: `/tmp/test-workspace-${Date.now()}`,
    isCurrent: false,
  };

  const req = new Request("http://localhost/api/workspaces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(customWs),
  });

  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.ok, true);

  // Verify it appears in GET /api/workspaces
  const getRes = await handleApiRequest(new Request("http://localhost/api/workspaces"));
  const getData = await getRes.json();
  const found = getData.workspaces.some((w: Workspace) => w.id === customWs.id);
  assertEquals(found, true);
});

Deno.test("handleApiRequest handles POST /api/toggle", async () => {
  const tempDir = await Deno.makeTempDir();
  const sourceSkillDir = `${tempDir}/source-skill`;
  const workspaceDir = `${tempDir}/workspace`;

  await Deno.mkdir(sourceSkillDir, { recursive: true });
  await Deno.writeTextFile(`${sourceSkillDir}/SKILL.md`, "---\nname: Toggle Test\n---\nBody");
  await Deno.mkdir(workspaceDir, { recursive: true });

  // 1. Enable
  const enableReq = new Request("http://localhost/api/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillSlug: "test-toggle-skill",
      sourcePath: sourceSkillDir,
      workspacePath: workspaceDir,
      agent: "cursor",
      enable: true,
    }),
  });

  const enableRes = await handleApiRequest(enableReq);
  assertEquals(enableRes.status, 200);
  const enableData = await enableRes.json();
  assertEquals(enableData.ok, true);

  // 2. Disable
  const disableReq = new Request("http://localhost/api/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      skillSlug: "test-toggle-skill",
      sourcePath: sourceSkillDir,
      workspacePath: workspaceDir,
      agent: "cursor",
      enable: false,
    }),
  });

  const disableRes = await handleApiRequest(disableReq);
  assertEquals(disableRes.status, 200);
  const disableData = await disableRes.json();
  assertEquals(disableData.ok, true);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("handleApiRequest handles POST /api/check-updates", async () => {
  const req = new Request("http://localhost/api/check-updates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skills: [] }),
  });

  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(typeof data.updates, "object");
});

Deno.test("handleApiRequest handles POST /api/install", async () => {
  // Test invalid repo
  const badReq = new Request("http://localhost/api/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ source: "invalid-source" }),
  });
  const badRes = await handleApiRequest(badReq);
  assertEquals(badRes.status, 400);
  const badData = await badRes.json();
  assertEquals(badData.ok, false);

  // Test valid repo format
  const tempDir = await Deno.makeTempDir();
  const goodReq = new Request("http://localhost/api/install", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: "facebook/react",
      targetDir: `${tempDir}/installed-skill`,
    }),
  });
  const goodRes = await handleApiRequest(goodReq);
  assertEquals(goodRes.status, 200);
  const goodData = await goodRes.json();
  assertEquals(goodData.ok, true);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("handleApiRequest handles GET /api/agents", async () => {
  const req = new Request("http://localhost/api/agents");
  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data.agents), true);
  assertEquals(data.agents.length > 0, true);
});

Deno.test("handleApiRequest handles DELETE /api/skills", async () => {
  const tempDir = await Deno.makeTempDir();
  const skillDir = `${tempDir}/skill-to-delete`;
  await Deno.mkdir(skillDir, { recursive: true });
  await Deno.writeTextFile(`${skillDir}/SKILL.md`, "test");

  const req = new Request("http://localhost/api/skills", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: skillDir }),
  });

  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(data.ok, true);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("handleApiRequest returns 404 for unknown endpoints", async () => {
  const req = new Request("http://localhost/api/unknown-endpoint");
  const res = await handleApiRequest(req);
  assertEquals(res.status, 404);
});

Deno.test("api client methods interact with backend correctly", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const fullUrl = url.startsWith("http") ? url : `http://localhost${url}`;
      const method = init?.method || (typeof input === "object" && "method" in input ? (input as Request).method : "GET");
      const headers = init?.headers || (typeof input === "object" && "headers" in input ? (input as Request).headers : undefined);
      const body = init?.body || (typeof input === "object" && "body" in input ? (input as Request).body : undefined);

      const request = new Request(fullUrl, {
        method,
        headers,
        body: body as BodyInit,
      });

      return handleApiRequest(request);
    };

    // Test getSkills
    const skills = await api.getSkills();
    assertEquals(Array.isArray(skills), true);

    // Test getWorkspaces
    const workspaces = await api.getWorkspaces();
    assertEquals(Array.isArray(workspaces), true);

    // Test addWorkspace
    const newWs: Workspace = {
      id: "client-test-ws",
      name: "Client Test WS",
      path: "/tmp/client-test-ws",
    };
    const addSuccess = await api.addWorkspace(newWs);
    assertEquals(addSuccess, true);

    // Test toggleSkill
    const toggleSuccess = await api.toggleSkill({
      skillSlug: "test-slug",
      sourcePath: "/tmp/source",
      workspacePath: "/tmp/ws",
      agent: "cursor",
      enable: true,
    });
    assertEquals(typeof toggleSuccess, "boolean");

    // Test checkUpdates
    const updates = await api.checkUpdates([]);
    assertEquals(typeof updates, "object");

    // Test installSkill
    const installRes = await api.installSkill({ source: "invalid" });
    assertEquals(installRes.ok, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
