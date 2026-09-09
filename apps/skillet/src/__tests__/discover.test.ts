import { buildInstallSource, mapTreeToSkillItems, POPULAR_REPOS } from "../tabs/DiscoverTab";

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
