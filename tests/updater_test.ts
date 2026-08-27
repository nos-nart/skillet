import { assertEquals, assertExists } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  compareCommitShas,
  parseGitHubRepo,
  fetchLatestGitHubCommit,
  loadSkillsLock,
  saveSkillsLock,
  LockFileEntry,
  SkillsLock,
} from "../src/backend/updater.ts";
import { downloadSkillFromGitHub } from "../src/backend/installer.ts";

Deno.test("compareCommitShas detects outdated vs up-to-date versions", () => {
  assertEquals(compareCommitShas("abc1234", "abc1234"), false);
  assertEquals(compareCommitShas("ABC1234", "abc1234"), false);
  assertEquals(compareCommitShas(" abc1234 ", "abc1234"), false);
  assertEquals(compareCommitShas("abc1234", "def5678"), true);
  assertEquals(compareCommitShas(undefined, "def5678"), true);
  assertEquals(compareCommitShas("abc1234", undefined), true);
  assertEquals(compareCommitShas("", "def5678"), true);
});

Deno.test("parseGitHubRepo extracts owner and repo from various formats", () => {
  assertEquals(parseGitHubRepo("vercel-labs/skills"), { owner: "vercel-labs", repo: "skills" });
  assertEquals(parseGitHubRepo("https://github.com/cursor/plugins"), { owner: "cursor", repo: "plugins" });
  assertEquals(parseGitHubRepo("https://github.com/cursor/plugins.git"), { owner: "cursor", repo: "plugins" });
  assertEquals(parseGitHubRepo("git@github.com:mattpocock/skills.git"), { owner: "mattpocock", repo: "skills" });
  assertEquals(parseGitHubRepo("https://github.com/owner/sub-repo/extra/path"), { owner: "owner", repo: "sub-repo" });
  assertEquals(parseGitHubRepo("invalid-repo"), null);
  assertEquals(parseGitHubRepo(""), null);
  assertEquals(parseGitHubRepo("https://gitlab.com/owner/repo"), null);
});

Deno.test("fetchLatestGitHubCommit returns null for invalid repo format", async () => {
  const result = await fetchLatestGitHubCommit("invalid-repo-format");
  assertEquals(result, null);
});

Deno.test("fetchLatestGitHubCommit parses API response", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = (input: string | URL | Request, _init?: RequestInit) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.includes("api.github.com/repos/test-owner/test-repo/commits")) {
        return Promise.resolve(
          new Response(JSON.stringify([{ sha: "commit-sha-123456" }]), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      return Promise.resolve(new Response("Not Found", { status: 404 }));
    };

    const sha = await fetchLatestGitHubCommit("test-owner/test-repo");
    assertEquals(sha, "commit-sha-123456");

    const failedSha = await fetchLatestGitHubCommit("nonexistent/repo");
    assertEquals(failedSha, null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

Deno.test("loadSkillsLock and saveSkillsLock manage lockfile persistence", async () => {
  const tempDir = await Deno.makeTempDir();
  const lockFilePath = `${tempDir}/skills-lock.json`;

  // Initially empty when file doesn't exist
  const initial = await loadSkillsLock(lockFilePath);
  assertEquals(initial, {});

  // Save new lock entries
  const sampleLock: SkillsLock = {
    "vercel-labs/skills": {
      source: "vercel-labs/skills",
      commitSha: "sha-abc-123",
      updatedAt: "2026-08-27T10:00:00Z",
      skills: ["web-design", "frontend"],
    },
  };

  const saved = await saveSkillsLock(sampleLock, lockFilePath);
  assertEquals(saved, true);

  // Load saved lock entries
  const loaded = await loadSkillsLock(lockFilePath);
  assertEquals(loaded["vercel-labs/skills"].commitSha, "sha-abc-123");
  assertEquals(loaded["vercel-labs/skills"].skills, ["web-design", "frontend"]);

  // Corrupted file handling
  await Deno.writeTextFile(lockFilePath, "invalid json {");
  const corrupted = await loadSkillsLock(lockFilePath);
  assertEquals(corrupted, {});

  await Deno.remove(tempDir, { recursive: true });
});

Deno.test("downloadSkillFromGitHub validates input and creates target directory", async () => {
  const tempDir = await Deno.makeTempDir();
  const targetDir = `${tempDir}/downloaded-skill`;

  const invalidRes = await downloadSkillFromGitHub({ source: "invalid-source" });
  assertEquals(invalidRes.ok, false);
  if (!invalidRes.ok) {
    assertEquals(invalidRes.error, "Invalid GitHub repository format");
  }

  const validRes = await downloadSkillFromGitHub({
    source: "cursor/plugins",
    targetDir,
  });

  assertEquals(validRes.ok, true);
  if (validRes.ok) {
    assertEquals(validRes.path, targetDir);
  }

  const dirStat = await Deno.stat(targetDir);
  assertEquals(dirStat.isDirectory, true);

  await Deno.remove(tempDir, { recursive: true });
});
