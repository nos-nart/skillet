import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import {
  currentWorkspacePathAtom,
  fetchWorkspacesAtom,
} from "../workspacesAtoms";

describe("workspacesAtoms", () => {
  it("manages currentWorkspacePathAtom", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(currentWorkspacePathAtom)).toBeUndefined();

    registry.set(currentWorkspacePathAtom, "/workspaces/ws1");
    expect(registry.get(currentWorkspacePathAtom)).toBe("/workspaces/ws1");
  });

  it("initializes fetchWorkspacesAtom as Initial AsyncResult", () => {
    const registry = AtomRegistry.make();
    const result = registry.get(fetchWorkspacesAtom);
    expect(result._tag).toBe("Initial");
    expect(result.waiting).toBe(false);
  });
});
