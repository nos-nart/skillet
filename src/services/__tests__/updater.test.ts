import { Effect } from "effect";
import { checkSkillUpdates, checkSkillUpdatesEffect } from "../updater";
import type { Skill } from "../skills";
import type { FetchFn } from "../github";

const makeDummySkill = (id: string, pkg: string): Skill => ({
  id,
  name: id,
  slug: id,
  packageName: pkg,
  scope: "global",
  agent: "claude-code",
  path: `/skills/${id}`,
  skillMdPath: `/skills/${id}/SKILL.md`,
  metadata: { name: id, description: id },
  rawMarkdown: "",
  isSymlink: false,
});

describe("Effect Updater Service", () => {
  it("executes updates check with bounded concurrency of 5", async () => {
    let running = 0;
    let maxRunning = 0;

    const fetchImpl: FetchFn = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 20));
      running--;
      return {
        ok: true,
        json: async () => [{ sha: "head123" }],
        text: async () => "",
      };
    };

    const skills: Skill[] = Array.from({ length: 10 }, (_, i) =>
      makeDummySkill(`skill-${i}`, `test-owner/pkg-${i}`),
    );

    const updates = await Effect.runPromise(
      checkSkillUpdatesEffect(skills, { fetchImpl }),
    );

    expect(Object.keys(updates)).toHaveLength(10);
    expect(maxRunning).toBeLessThanOrEqual(5);
  });

  it("ensures failure in one package check does not block other packages", async () => {
    const fetchImpl: FetchFn = async (url) => {
      if (url.includes("failing-pkg")) {
        throw new Error("Network drop for failing package");
      }
      return {
        ok: true,
        json: async () => [{ sha: "latest-sha" }],
        text: async () => "",
      };
    };

    const skills: Skill[] = [
      makeDummySkill("s1", "owner/failing-pkg"),
      makeDummySkill("s2", "owner/healthy-pkg"),
    ];

    const updates = await Effect.runPromise(
      checkSkillUpdatesEffect(skills, { fetchImpl }),
    );

    expect(updates["owner/healthy-pkg"]).toBe(true);
    expect(updates["owner/failing-pkg"]).toBeUndefined();
  });

  it("preserves backward compatibility with Promise-based checkSkillUpdates", async () => {
    const fetchImpl: FetchFn = async () => ({
      ok: true,
      json: async () => [{ sha: "promise-sha" }],
      text: async () => "",
    });

    const skills: Skill[] = [makeDummySkill("s1", "owner/pkg-1")];
    const updates = await checkSkillUpdates(skills, { fetchImpl });
    expect(updates["owner/pkg-1"]).toBe(true);
  });
});
