import { createStorage, type Storage } from "@legend-apps/storage";

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

export async function getWorkspaces(store: JsonStore = storageJsonStore()): Promise<Workspace[]> {
  try {
    const parsed = store.readJson<unknown>(WORKSPACES_FILE);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // SAFETY: workspaces.json persists as a JSON-serialized Workspace array
      return parsed as Workspace[];
    }
  } catch {
    // Fallback if file doesn't exist or is unparseable
  }
  return [{ ...DEFAULT_GLOBAL_WORKSPACE }];
}

export async function addWorkspace(
  ws: Workspace,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  const list = await getWorkspaces(store);
  if (!list.some((w) => w.path === ws.path || w.id === ws.id)) {
    list.push(ws);
    store.writeJson(WORKSPACES_FILE, list);
  }
}

export async function removeWorkspace(
  idOrPath: string,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  const list = await getWorkspaces(store);
  const filtered = list.filter((w) => w.id !== idOrPath && w.path !== idOrPath);
  if (filtered.length === 0) {
    filtered.push({ ...DEFAULT_GLOBAL_WORKSPACE });
  }
  store.writeJson(WORKSPACES_FILE, filtered);
}

export async function setCurrentWorkspace(
  id: string,
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  const list = await getWorkspaces(store);
  const updated = list.map((w) => ({ ...w, isCurrent: w.id === id }));
  store.writeJson(WORKSPACES_FILE, updated);
}

export async function getBookmarks(store: JsonStore = storageJsonStore()): Promise<string[]> {
  try {
    const parsed = store.readJson<unknown>(BOOKMARKS_FILE);
    // SAFETY: bookmarks.json persists as a JSON-serialized string array
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

export async function saveBookmarks(
  bookmarks: string[],
  store: JsonStore = storageJsonStore(),
): Promise<void> {
  store.writeJson(BOOKMARKS_FILE, bookmarks);
}
