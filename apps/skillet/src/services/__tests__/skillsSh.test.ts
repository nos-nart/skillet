import { Effect } from "effect";
import {
  searchSkillsSh,
  searchSkillsShEffect,
  skillsShUrl,
  type SkillsShItem,
} from "../skillsSh";
import type { FetchFn } from "../github";

function mockFetch(payload: unknown, ok = true): FetchFn {
  return async () => ({
    ok,
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  });
}

const payload = {
  query: "turborepo",
  skills: [
    { id: "a/turborepo", skillId: "turborepo", name: "turborepo", source: "a", installs: 3 },
    { id: "v/turborepo/turborepo", skillId: "turborepo", name: "turborepo", source: "v/turborepo", installs: 75576 },
    { id: "broken", source: "x", installs: 1 },
  ],
};

test("maps and sorts hits by installs, dropping malformed entries", async () => {
  const res = await searchSkillsSh("turborepo", { fetchImpl: mockFetch(payload) });
  expect(res.ok).toBe(true);
  if (!res.ok) return;
  expect(res.items.map((i) => i.installs)).toEqual([75576, 3]);
  expect(res.items[0]).toMatchObject({ skillId: "turborepo", source: "v/turborepo" });
});

test("short queries resolve empty without fetching", async () => {
  let called = false;
  const res = await searchSkillsSh("x", {
    fetchImpl: (async () => {
      called = true;
      return mockFetch(payload)("", undefined);
    }) as FetchFn,
  });
  expect(called).toBe(false);
  expect(res).toEqual({ ok: true, items: [] });
});

test("non-ok responses fail with a message", async () => {
  const res = await searchSkillsSh("turborepo", { fetchImpl: mockFetch({}, false) });
  expect(res.ok).toBe(false);
});

test("malformed payloads fail with a message", async () => {
  const res = await searchSkillsSh("turborepo", { fetchImpl: mockFetch({ nope: 1 }) });
  expect(res.ok).toBe(false);
});

test("effect variant surfaces typed errors", async () => {
  const exit = await Effect.runPromiseExit(searchSkillsShEffect("turborepo", { fetchImpl: mockFetch({}, false) }));
  expect(exit._tag).toBe("Failure");
});

test("skillsShUrl builds parseGitHubRepo-compatible urls", () => {
  const item = { source: "vercel-labs/skills", skillId: "find-skills" } as Pick<SkillsShItem, "source" | "skillId">;
  expect(skillsShUrl(item)).toBe("https://skills.sh/vercel-labs/skills/find-skills");
});
