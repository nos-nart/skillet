import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import {
  workspacesAtom,
  currentWorkspacePathAtom,
  fetchWorkspacesAtom,
} from "../workspacesAtoms";

describe("workspacesAtoms", () => {
  it("manages workspacesAtom and currentWorkspacePathAtom", () => {
    const registry = AtomRegistry.make();
    expect(registry.get(workspacesAtom)).toEqual([]);
    expect(registry.get(currentWorkspacePathAtom)).toBeUndefined();

    const mockWs = {
      id: "ws-1",
      name: "Workspace 1",
      path: "/workspaces/ws1",
    };

    registry.set(workspacesAtom, [mockWs]);
    registry.set(currentWorkspacePathAtom, mockWs.path);

    expect(registry.get(workspacesAtom)).toEqual([mockWs]);
    expect(registry.get(currentWorkspacePathAtom)).toBe("/workspaces/ws1");
  });

  it("initializes fetchWorkspacesAtom as Initial AsyncResult", () => {
    const registry = AtomRegistry.make();
    const result = registry.get(fetchWorkspacesAtom);
    expect(result._tag).toBe("Initial");
    expect(result.waiting).toBe(false);
  });
});
