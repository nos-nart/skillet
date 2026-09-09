import {
  browseRepoForSkills,
  buildGitHubHeaders,
  buildInstallSource,
  mapTreeToSkillItems,
  parseGitHubRepo,
  POPULAR_REPOS,
  type FetchFn,
  type GitHubRepoInfo,
} from "../github";

function mustParse(source: string): GitHubRepoInfo {
  const info = parseGitHubRepo(source);
  if (!info) throw new Error(`test source did not parse: ${source}`);
  return info;
}

test("popular repos seed the discover list", () => {
  expect(POPULAR_REPOS.map((r) => r.fullName)).toContain("anthropics/skills");
  expect(POPULAR_REPOS.length).toBeGreaterThan(0);
});

test("maps a recursive tree to installable skill rows", () => {
  const items = mapTreeToSkillItems(
    [
      { type: "blob", path: "skills/eli5/SKILL.md" },
      { type: "blob", path: "README.md" },
      { type: "tree", path: "skills/eli5" },
    ],
    { owner: "anthropics", repo: "skills", branch: "main" },
  );
  expect(items).toEqual([
    {
      name: "eli5",
      path: "skills/eli5",
      htmlUrl: "https://github.com/anthropics/skills/tree/main/skills/eli5",
    },
  ]);
});

test("builds an install source from a discovered row", () => {
  expect(buildInstallSource({ owner: "anthropics", repo: "skills" }, "skills/eli5")).toBe(
    "anthropics/skills/skills/eli5",
  );
});

test("sends the token auth header on both api calls", async () => {
  const seen: Array<{ url: string; headers?: Record<string, string> }> = [];
  const fetchImpl: FetchFn = (url, init) => {
    seen.push({ url, headers: init?.headers });
    if (url.endsWith("/repos/anthropics/skills")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ default_branch: "main" }),
        text: () => Promise.resolve(""),
      });
    }
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({ tree: [{ type: "blob", path: "skills/eli5/SKILL.md" }] }),
      text: () => Promise.resolve(""),
    });
  };
  expect(buildGitHubHeaders("SECRET")).toMatchObject({
    Authorization: "token SECRET",
    Accept: "application/vnd.github.v3+json",
  });
  const found = await browseRepoForSkills(mustParse("anthropics/skills"), {
    token: "SECRET",
    fetchImpl,
  });
  expect(found.items).toHaveLength(1);
  expect(seen).toHaveLength(2);
  for (const call of seen) {
    expect(call.headers?.["Authorization"]).toBe("token SECRET");
  }
});

test("surfaces repository-not-found and rate-limit errors", async () => {
  const info = mustParse("anthropics/skills");
  const notFound: FetchFn = () =>
    Promise.resolve({
      ok: false,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    });
  await expect(browseRepoForSkills(info, { fetchImpl: notFound })).rejects.toThrow(
    "Repository not found",
  );
  const rateLimited: FetchFn = () =>
    Promise.resolve({
      ok: false,
      status: 403,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(""),
    } as never);
  await expect(browseRepoForSkills(info, { fetchImpl: rateLimited })).rejects.toThrow(
    "rate limit",
  );
});
