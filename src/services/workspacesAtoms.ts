import * as Effect from "effect/Effect";
import * as Atom from "effect/unstable/reactivity/Atom";
import { getWorkspacesEffect, type Workspace } from "./workspaces";
import type { FsError } from "./errors";

export const currentWorkspacePathAtom = Atom.make<string | undefined>(undefined);

export const fetchWorkspacesAtom = Atom.fn(
  (_?: void): Effect.Effect<Workspace[], FsError> => getWorkspacesEffect(),
);
