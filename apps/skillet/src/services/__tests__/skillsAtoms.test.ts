import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import { fetchSkillsAtom } from "../skillsAtoms";

describe("skillsAtoms", () => {
  it("initializes fetchSkillsAtom as Initial AsyncResult", () => {
    const registry = AtomRegistry.make();
    const result = registry.get(fetchSkillsAtom);
    expect(result._tag).toBe("Initial");
    expect(result.waiting).toBe(false);
  });
});
