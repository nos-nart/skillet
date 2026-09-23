import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import { skillsAtom, fetchSkillsAtom } from "../skillsAtoms";

describe("skillsAtoms", () => {
  it("manages skillsAtom state in registry", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(skillsAtom)).toEqual([]);

    const mockSkill = {
      id: "skill-1",
      name: "Skill One",
      slug: "skill-one",
      path: "/skills/skill-one",
      packageName: "test/pkg",
      metadata: {},
    } as any;

    registry.set(skillsAtom, [mockSkill]);
    expect(registry.get(skillsAtom)).toHaveLength(1);
    expect(registry.get(skillsAtom)[0]?.name).toBe("Skill One");
  });

  it("initializes fetchSkillsAtom as Initial AsyncResult", () => {
    const registry = AtomRegistry.make();
    const result = registry.get(fetchSkillsAtom);
    expect(result._tag).toBe("Initial");
    expect(result.waiting).toBe(false);
  });
});
