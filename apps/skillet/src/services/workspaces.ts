import { createStorage, type Storage } from "@legend-apps/storage";
import * as Effect from "effect/Effect";
import { FsError } from "./errors";

// Storage-backed workspace/bookmark state for the macOS app, porting
// `WorkspaceManager` (`src/backend/workspace.ts`) plus the bookmarks
// endpoints from `src/backend/api.ts`. Persists under the app storage
// (spec §3: `createStorage({ root: "applicationSupport", subfolder: "skillet" })`)
// instead of `SKILLET_CONFIG_PATH` / `~/.skills/bookmarks.json`.

export interface Workspace {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
}

export interface JsonStore {
  readJson<T>(filename: string): T | undefined;
  writeJson(filename: string, value: unknown): void;
}

const WORKSPACES_FILE = "workspaces.json";
const BOOKMARKS_FILE = "bookmarks.json";

const DEFAULT_GLOBAL_WORKSPACE: Workspace = {
  id: "global",
  name: "Global Scope",
  path: "~/.skills",
  isCurrent: true,
};

let cachedStorage: Storage | null = null;

export function getWorkspaceStorage(): Storage {
  if (!cachedStorage) {
    cachedStorage = createStorage({ root: "applicationSupport", subfolder: "skillet" });
  }
  return cachedStorage;
}

export function storageJsonStore(storage: Storage = getWorkspaceStorage()): JsonStore {
  return {
    readJson<T>(filename: string): T | undefined {
      return storage.read<T>(filename, { format: "json" });
    },
    writeJson(filename: string, value: unknown): void {
      storage.write(filename, value, { format: "json" });
    },
  };
}

export const getWorkspacesEffect = (
  store: JsonStore = storageJsonStore(),
): Effect.Effect<Workspace[], FsError> =>
  Effect.try({
    try: () => {
      const parsed = store.readJson<unknown>(WORKSPACES_FILE);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as Workspace[];
      }
      return [{ ...DEFAULT_GLOBAL_WORKSPACE }];
    },
    catch: (err) =>
      new FsError({
        operation: "getWorkspaces",
        path: WORKSPACES_FILE,
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export async function getWorkspaces(store: JsonStore = storageJsonStore()): Promise<Workspace[]> {
  return Effect.runPromise(
    getWorkspacesEffect(store).pipe(
      Effect.catch(() => Effect.succeed([{ ...DEFAULT_GLOBAL_WORKSPACE }])),
    ),
  );
}

const writeWorkspacesFileEffect = (
  store: JsonStore,
  data: Workspace[],
): Effect.Effect<void, FsError> =>
  Effect.try({
    try: () => store.writeJson(WORKSPACES_FILE, data),
    catch: (err) =>
      new FsError({
        operation: "writeJson",
        path: WORKSPACES_FILE,
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export const addWorkspaceEffect = (
  ws: Workspace,
  store: JsonStore = storageJsonStore(),
): Effect.Effect<void, FsError> =>
  Effect.gen(function* () {
    const list = yield* getWorkspacesEffect(store);
    if (!list.some((w) => w.path === ws.path || w.id === ws.id)) {
      list.push(ws);
      yield* writeWorkspacesFileEffect(store, list);
    }
  });

export async function addWorkspace(
  ws: Workspace,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  return Effect.runPromise(addWorkspaceEffect(ws, store));
}

export const removeWorkspaceEffect = (
  idOrPath: string,
  store: JsonStore = storageJsonStore(),
): Effect.Effect<void, FsError> =>
  Effect.gen(function* () {
    const list = yield* getWorkspacesEffect(store);
    const filtered = list.filter((w) => w.id !== idOrPath && w.path !== idOrPath);
    if (filtered.length === 0) {
      filtered.push({ ...DEFAULT_GLOBAL_WORKSPACE });
    }
    yield* writeWorkspacesFileEffect(store, filtered);
  });

export async function removeWorkspace(
  idOrPath: string,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  return Effect.runPromise(removeWorkspaceEffect(idOrPath, store));
}

export const setCurrentWorkspaceEffect = (
  id: string,
  store: JsonStore = storageJsonStore(),
): Effect.Effect<void, FsError> =>
  Effect.gen(function* () {
    const list = yield* getWorkspacesEffect(store);
    const updated = list.map((w) => ({ ...w, isCurrent: w.id === id }));
    yield* writeWorkspacesFileEffect(store, updated);
  });

export async function setCurrentWorkspace(
  id: string,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  return Effect.runPromise(setCurrentWorkspaceEffect(id, store));
}

export const getBookmarksEffect = (
  store: JsonStore = storageJsonStore(),
): Effect.Effect<string[], FsError> =>
  Effect.try({
    try: () => {
      const parsed = store.readJson<unknown>(BOOKMARKS_FILE);
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    },
    catch: (err) =>
      new FsError({
        operation: "getBookmarks",
        path: BOOKMARKS_FILE,
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export async function getBookmarks(store: JsonStore = storageJsonStore()): Promise<string[]> {
  return Effect.runPromise(
    getBookmarksEffect(store).pipe(
      Effect.catch(() => Effect.succeed([] as string[])),
    ),
  );
}

export const saveBookmarksEffect = (
  bookmarks: string[],
  store: JsonStore = storageJsonStore(),
): Effect.Effect<void, FsError> =>
  Effect.try({
    try: () => store.writeJson(BOOKMARKS_FILE, bookmarks),
    catch: (err) =>
      new FsError({
        operation: "writeJson",
        path: BOOKMARKS_FILE,
        message: err instanceof Error ? err.message : String(err),
      }),
  });

export async function saveBookmarks(
  bookmarks: string[],
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  return Effect.runPromise(saveBookmarksEffect(bookmarks, store));
}
