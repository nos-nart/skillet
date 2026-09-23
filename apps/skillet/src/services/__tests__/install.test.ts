import { Effect } from "effect";
import {
  downloadSkill,
  downloadSkillEffect,
  installSkill,
  installSkillEffect,
  uninstallSkill,
  uninstallSkillEffect,
  type SkillWriter,
  type SkillsFs,
} from "../skills";
import { GitHubRateLimitError, InvalidSlugError } from "../errors";
import type { FetchFn } from "../github";
import type { JsonStore } from "../workspaces";

function fakeWriter() {
  const files = new Map<string, string>();
  const dirs: string[] = [];
  const writer: SkillWriter = {
    ensureDir: async (path: string) => {
      dirs.push(path);
      return true;
    },
    writeTextFile: async (path: string, contents: string) => {
      files.set(path, contents);
      return true;
    },
  };
  return { files, dirs, writer };
}

function memoryStore() {
  let data: unknown = null;
  const store: JsonStore = {
    readJson: <T,>(): T | undefined => data as T | undefined,
    writeJson: (_filename: string, value: unknown): void => {
      data = value;
    },
  };
  return { store, peek: (): unknown => data };
}

// Serves raw SKILL.md on main plus the commits API; master is never reached.
function stubFetch(skillMd: string | null): FetchFn {
  return async (url: string) => ({
    ok: url.includes("/commits?")
      ? true
      : skillMd !== null && url.includes("/main/"),
    json: async () => [{ sha: "deadbee" }],
    text: async () => skillMd ?? "",
  });
}

test("installs a fetched SKILL.md under owner/slug and records the lock", async () => {
  const { files, writer } = fakeWriter();
  const { store, peek } = memoryStore();
  const res = await downloadSkill(
    { source: "anthropics/skills/skills/eli5" },
    { writer, fetchImpl: stubFetch("---\nname: eli5\n---\n\nBody"), lockStore: store },
  );
  // "anthropics" hits the installer.ts claude heuristic → ~/.claude/skills.
  expect(res).toEqual({ ok: true, path: "~/.claude/skills/anthropics/eli5" });
  expect(files.get("~/.claude/skills/anthropics/eli5/SKILL.md")).toContain("name: eli5");
  expect(peek()).toEqual({
    "anthropics/skills": {
      source: "anthropics/skills/skills/eli5",
      commitSha: "deadbee",
      updatedAt: expect.any(String),
      skills: ["eli5"],
    },
  });
});

test("routes installs to the agent skill dir matching the repo", async () => {
  const { writer } = fakeWriter();
  const deps = { writer, fetchImpl: stubFetch(null), lockStore: memoryStore().store };
  const cases: Array<[string, string]> = [
    ["cursor/plugins/myskill", "~/.cursor/skills/cursor/myskill"],
    ["gemini-team/skills/cool", "~/.gemini/config/skills/gemini-team/cool"],
    ["anthropics/skills/skills/eli5", "~/.claude/skills/anthropics/eli5"],
    ["windsurf-team/skills/cool", "~/.codeium/windsurf/skills/windsurf-team/cool"],
    ["copilot-team/skills/cool", "~/.github/skills/copilot-team/cool"],
    ["vercel-labs/skills/frontend/design", "~/.skills/vercel-labs/design"],
  ];
  for (const [source, path] of cases) {
    await expect(downloadSkill({ source }, deps)).resolves.toEqual({ ok: true, path });
  }
});

test("writes a source_url template when SKILL.md is missing", async () => {
  const { files, writer } = fakeWriter();
  const res = await downloadSkill(
    { source: "anthropics/skills" },
    { writer, fetchImpl: stubFetch(null), lockStore: memoryStore().store },
  );
  expect(res).toEqual({ ok: true, path: "~/.claude/skills/anthropics/skills" });
  const written = files.get("~/.claude/skills/anthropics/skills/SKILL.md") ?? "";
  expect(written).toContain("source_url: https://github.com/anthropics/skills");
});

test("rejects invalid sources and unsafe slugs", async () => {
  const { writer } = fakeWriter();
  const store = memoryStore().store;
  await expect(
    downloadSkill({ source: "not a repo?!" }, { writer, fetchImpl: stubFetch(null), lockStore: store }),
  ).resolves.toEqual({ ok: false, error: "Invalid GitHub repository format" });
  await expect(
    downloadSkill(
      { source: "anthropics/skills", skillName: "../evil" },
      { writer, fetchImpl: stubFetch(null), lockStore: store },
    ),
  ).resolves.toEqual({ ok: false, error: expect.stringContaining("slug") });
});

function fakeDeleteFs(existing: string[]): SkillsFs & { unlinked: string[] } {
  const unlinked: string[] = [];
  return {
    unlinked,
    scanSkillsDir: async (dir: string) => existing.filter((p) => p.startsWith(`${dir}/`)),
    readSkillMd: async () => {
      throw new Error("unused");
    },
    symlink: async () => true,
    unlink: async (target: string) => {
      unlinked.push(target);
      return true;
    },
  };
}

test("uninstall removes the skill dir and workspace links", async () => {
  const fs = fakeDeleteFs([
    "/ws/proj/.skills/eli5",
    "/Users/x/.skills/anthropics/eli5",
  ]);
  const ok = await uninstallSkill(
    {
      skillPath: "/Users/x/.skills/anthropics/eli5",
      skillSlug: "eli5",
      workspacePaths: ["/ws/proj"],
    },
    fs,
  );
  expect(ok).toBe(true);
  expect(fs.unlinked).toContain("/Users/x/.skills/anthropics/eli5");
  expect(fs.unlinked).toContain("/ws/proj/.skills/eli5");
});

test("uninstall refuses unsafe slugs", async () => {
  const fs = fakeDeleteFs([]);
  await expect(
    uninstallSkill({ skillPath: "/Users/x/.skills/e", skillSlug: "../evil" }, fs),
  ).resolves.toBe(false);
  expect(fs.unlinked).toEqual([]);
});

test("downloadSkillEffect returns typed InvalidSlugError on unsafe slug", async () => {
  const { writer } = fakeWriter();
  const store = memoryStore().store;
  const err = await Effect.runPromise(
    downloadSkillEffect(
      { source: "anthropics/skills", skillName: "../evil" },
      { writer, fetchImpl: stubFetch(null), lockStore: store },
    ).pipe(Effect.flip),
  );
  expect(err).toBeInstanceOf(InvalidSlugError);
});

test("uninstallSkillEffect returns typed InvalidSlugError on unsafe slug", async () => {
  const fs = fakeDeleteFs([]);
  const err = await Effect.runPromise(
    uninstallSkillEffect({ skillPath: "/Users/x/.skills/e", skillSlug: "../evil" }, fs).pipe(
      Effect.flip,
    ),
  );
  expect(err).toBeInstanceOf(InvalidSlugError);
});

test("installSkillEffect propagates GitHubRateLimitError when fetch fails with 403", async () => {
  const { writer } = fakeWriter();
  const store = memoryStore().store;
  const rateLimitFetch: FetchFn = async () => ({
    ok: false,
    status: 403,
    json: async () => ({}),
    text: async () => "",
  });

  const err = await Effect.runPromise(
    installSkillEffect(
      { source: "anthropics/skills/skills/eli5" },
      { writer, fetchImpl: rateLimitFetch, lockStore: store },
    ).pipe(Effect.flip),
  );
  expect(err).toBeInstanceOf(GitHubRateLimitError);
});

test("installSkill alias works cleanly with installSkillEffect", async () => {
  const { files, writer } = fakeWriter();
  const { store } = memoryStore();
  const res = await installSkill(
    { source: "anthropics/skills/skills/eli5" },
    { writer, fetchImpl: stubFetch("---\nname: eli5\n---\n\nBody"), lockStore: store },
  );
  expect(res.ok).toBe(true);
});
