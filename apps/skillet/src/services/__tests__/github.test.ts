import { createStorage } from "@legend-apps/storage";
import {
  buildGitHubHeaders,
  compareCommitShas,
  fetchLatestCommit,
  fetchSkillMd,
  loadSkillsLock,
  parseGitHubRepo,
  saveSkillsLock,
  type FetchFn,
} from "../github";
import { storageJsonStore } from "../workspaces";

test("parses shorthand owner/repo with path", () => {
  expect(parseGitHubRepo("vercel-labs/skills/frontend/design")).toEqual({
    owner: "vercel-labs",
    repo: "skills",
    path: "frontend/design",
  });
});

test("parses https url with tree branch and path", () => {
  expect(parseGitHubRepo("https://github.com/anthropics/skills/tree/main/skills/eli5")).toEqual({
    owner: "anthropics",
    repo: "skills",
    path: "skills/eli5",
  });
});

test("parses known owner shorthand to default repo", () => {
  expect(parseGitHubRepo("expo")).toEqual({ owner: "expo", repo: "skills" });
});

test("returns null for empty or garbage input", () => {
  expect(parseGitHubRepo("")).toBeNull();
  expect(parseGitHubRepo("not a repo?!")).toBeNull();
});

test("buildGitHubHeaders includes Authorization only when token passed", () => {
  expect(buildGitHubHeaders("SECRET")).toEqual({
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
    Authorization: "token SECRET",
  });
  expect(buildGitHubHeaders()).toEqual({
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
  });
  expect(buildGitHubHeaders() as Record<string, string>).not.toHaveProperty("Authorization");
});

test("compareCommitShas detects drift", () => {
  expect(compareCommitShas("abc", "abc")).toBe(false);
  expect(compareCommitShas("abc", "def")).toBe(true);
  expect(compareCommitShas(undefined, "def")).toBe(true);
  expect(compareCommitShas("  ", "def")).toBe(true);
});

function stubFetch(
  routes: Record<string, { ok: boolean; body: unknown }>,
  seen: string[],
): FetchFn {
  return async (url: string) => {
    seen.push(url);
    const route = routes[url];
    if (!route) {
      return { ok: false, json: async () => null, text: async () => "" };
    }
    return {
      ok: route.ok,
      json: async () => route.body,
      text: async () =>
        typeof route.body === "string" ? route.body : JSON.stringify(route.body),
    };
  };
}

test("fetchLatestCommit returns sha from api", async () => {
  const seen: string[] = [];
  const sha = await fetchLatestCommit(
    "anthropics/skills",
    undefined,
    stubFetch(
      {
        "https://api.github.com/repos/anthropics/skills/commits?per_page=1": {
          ok: true,
          body: [{ sha: "deadbee" }],
        },
      },
      seen,
    ),
  );
  expect(sha).toBe("deadbee");
  expect(seen).toHaveLength(1);
});

test("fetchLatestCommit returns null on api failure or bad source", async () => {
  const seen: string[] = [];
  const fetchImpl = stubFetch({}, seen);
  await expect(fetchLatestCommit("anthropics/skills", undefined, fetchImpl)).resolves.toBeNull();
  await expect(fetchLatestCommit("", undefined, fetchImpl)).resolves.toBeNull();
  expect(seen).toHaveLength(1);
});

test("fetchSkillMd falls back from main to master", async () => {
  const seen: string[] = [];
  const info = parseGitHubRepo("anthropics/skills/skills/eli5");
  expect(info).not.toBeNull();
  const content = await fetchSkillMd(
    // SAFETY: asserted non-null above
    info as NonNullable<typeof info>,
    undefined,
    stubFetch(
      {
        "https://raw.githubusercontent.com/anthropics/skills/main/skills/eli5/SKILL.md": {
          ok: false,
          body: "",
        },
        "https://raw.githubusercontent.com/anthropics/skills/master/skills/eli5/SKILL.md": {
          ok: true,
          body: "---\nname: eli5\n---\n",
        },
      },
      seen,
    ),
  );
  expect(content).toContain("name: eli5");
  expect(seen).toEqual([
    "https://raw.githubusercontent.com/anthropics/skills/main/skills/eli5/SKILL.md",
    "https://raw.githubusercontent.com/anthropics/skills/master/skills/eli5/SKILL.md",
  ]);
});

test("skills lock round-trips through the store", async () => {
  const store = storageJsonStore(
    // SAFETY: test-only subfolder keeps suites isolated
    createStorage({ root: "applicationSupport", subfolder: "skillet-test-lock" }) as never,
  );
  await expect(loadSkillsLock(store)).resolves.toEqual({});
  const ok = await saveSkillsLock(
    {
      "anthropics/skills": {
        source: "anthropics/skills",
        commitSha: "deadbee",
        updatedAt: "2026-09-09T00:00:00.000Z",
        skills: ["eli5"],
      },
    },
    store,
  );
  expect(ok).toBe(true);
  await expect(loadSkillsLock(store)).resolves.toEqual({
    "anthropics/skills": {
      source: "anthropics/skills",
      commitSha: "deadbee",
      updatedAt: "2026-09-09T00:00:00.000Z",
      skills: ["eli5"],
    },
  });
});
