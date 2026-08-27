import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  enableSkillInWorkspace,
  disableSkillInWorkspace,
  isSkillEnabledInWorkspace,
  getAgentRelPath,
  validateSafeSlug,
} from "../src/backend/symlinker.ts";
import { WorkspaceManager } from "../src/backend/workspace.ts";

Deno.test("getAgentRelPath - returns expected relative paths for known agents", () => {
  assertEquals(getAgentRelPath("cursor"), ".cursor/skills");
  assertEquals(getAgentRelPath("claude-code"), ".claude/skills");
  assertEquals(getAgentRelPath("gemini"), ".gemini/skills");
  assertEquals(getAgentRelPath("antigravity"), ".gemini/skills");
  assertEquals(getAgentRelPath("windsurf"), ".windsurf/skills");
  assertEquals(getAgentRelPath("copilot"), ".github/skills");
  assertEquals(getAgentRelPath("codex"), ".codex/skills");
  assertEquals(getAgentRelPath("opencode"), ".opencode/skills");
  assertEquals(getAgentRelPath("generic"), ".skills");
});

Deno.test("validateSafeSlug - validates alphanumeric, hyphens, and blocks path traversal", () => {
  assertEquals(validateSafeSlug("normal-skill"), true);
  assertEquals(validateSafeSlug("my_skill.v2"), true);
  assertEquals(validateSafeSlug("skill123"), true);

  // Attack / traversal cases
  assertEquals(validateSafeSlug("../escape"), false);
  assertEquals(validateSafeSlug("/absolute/path"), false);
  assertEquals(validateSafeSlug("nested/slug"), false);
  assertEquals(validateSafeSlug(".."), false);
  assertEquals(validateSafeSlug("."), false);
  assertEquals(validateSafeSlug(""), false);
});

Deno.test("enableSkillInWorkspace creates symlink and disable removes it", async () => {
  const tempDir = await Deno.makeTempDir();
  const sourceSkillDir = `${tempDir}/source-skill`;
  const workspaceDir = `${tempDir}/my-project`;

  await Deno.mkdir(sourceSkillDir, { recursive: true });
  await Deno.writeTextFile(`${sourceSkillDir}/SKILL.md`, "---\nname: test\n---\nBody");
  await Deno.mkdir(workspaceDir, { recursive: true });

  // Verify initially not enabled
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), false);

  // Enable skill
  const success = await enableSkillInWorkspace(sourceSkillDir, "test-skill", workspaceDir, "cursor");
  assertEquals(success, true);
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), true);

  // Verify symlink is valid and points to sourceSkillDir
  const symlinkPath = `${workspaceDir}/.cursor/skills/test-skill`;
  const lstat = await Deno.lstat(symlinkPath);
  assertEquals(lstat.isSymlink, true);

  // Re-enable skill (idempotence / overwrite check)
  const successAgain = await enableSkillInWorkspace(sourceSkillDir, "test-skill", workspaceDir, "cursor");
  assertEquals(successAgain, true);
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), true);

  // Disable skill
  const disabled = await disableSkillInWorkspace("test-skill", workspaceDir, "cursor");
  assertEquals(disabled, true);
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), false);

  // Disabling already disabled skill returns false
  const disabledAgain = await disableSkillInWorkspace("test-skill", workspaceDir, "cursor");
  assertEquals(disabledAgain, false);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("enableSkillInWorkspace works across different agent directories", async () => {
  const tempDir = await Deno.makeTempDir();
  const sourceSkillDir = `${tempDir}/source-skill`;
  const workspaceDir = `${tempDir}/my-project`;

  await Deno.mkdir(sourceSkillDir, { recursive: true });
  await Deno.writeTextFile(`${sourceSkillDir}/SKILL.md`, "---\nname: test\n---\nBody");

  // Enable for antigravity
  const successAntigravity = await enableSkillInWorkspace(sourceSkillDir, "ag-skill", workspaceDir, "antigravity");
  assertEquals(successAntigravity, true);
  assertEquals(await isSkillEnabledInWorkspace("ag-skill", workspaceDir, "antigravity"), true);

  const lstat = await Deno.lstat(`${workspaceDir}/.gemini/skills/ag-skill`);
  assertEquals(lstat.isSymlink, true);

  // Disable for antigravity
  const disabled = await disableSkillInWorkspace("ag-skill", workspaceDir, "antigravity");
  assertEquals(disabled, true);
  assertEquals(await isSkillEnabledInWorkspace("ag-skill", workspaceDir, "antigravity"), false);

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("WorkspaceManager - returns default global scope when config does not exist or is invalid", async () => {
  const tempDir = await Deno.makeTempDir();
  const nonExistentConfigFile = `${tempDir}/workspaces.json`;

  const manager = new WorkspaceManager(nonExistentConfigFile);
  const workspaces = await manager.getWorkspaces();

  assertEquals(workspaces.length, 1);
  assertEquals(workspaces[0].id, "global");
  assertEquals(workspaces[0].name, "Global Scope");
  assertEquals(workspaces[0].isCurrent, true);

  // Corrupt JSON file fallback
  await Deno.writeTextFile(nonExistentConfigFile, "{ invalid json ]");
  const fallback = await manager.getWorkspaces();
  assertEquals(fallback.length, 1);
  assertEquals(fallback[0].id, "global");

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("WorkspaceManager - can add, switch current, and remove workspaces", async () => {
  const tempDir = await Deno.makeTempDir();
  const configFile = `${tempDir}/nested/config/workspaces.json`;

  const manager = new WorkspaceManager(configFile);

  // Initial workspaces
  const initial = await manager.getWorkspaces();
  assertEquals(initial.length, 1);

  // Add a new workspace
  await manager.addWorkspace({
    id: "proj-1",
    name: "My Project",
    path: "/path/to/my-project",
  });

  const updated = await manager.getWorkspaces();
  assertEquals(updated.length, 2);
  assertEquals(updated.some((w) => w.id === "proj-1" && w.path === "/path/to/my-project"), true);

  // Set current workspace
  await manager.setCurrentWorkspace("proj-1");
  const afterSetCurrent = await manager.getWorkspaces();
  assertEquals(afterSetCurrent.find((w) => w.id === "proj-1")?.isCurrent, true);
  assertEquals(afterSetCurrent.find((w) => w.id === "global")?.isCurrent, false);

  // Remove workspace
  await manager.removeWorkspace("proj-1");
  const afterRemove = await manager.getWorkspaces();
  assertEquals(afterRemove.length, 1);
  assertEquals(afterRemove.some((w) => w.id === "proj-1"), false);

  await Deno.remove(tempDir, { recursive: true });
});
