import { settings } from "@legendapp/spark/settings";

export type JsonOptions = { format: "json" };

export interface Storage {
  read<T>(relativePath: string, options?: JsonOptions): T | undefined;
  write(relativePath: string, value: unknown, options?: JsonOptions): void;
}

const KNOWN_FILES = [
  "workspaces.json",
  "bookmarks.json",
  "settings.json",
  "skills-lock.json",
] as const;

const stores = new Map<string, Map<string, unknown>>();

function keyFor(root: string, subfolder: string | undefined): string {
  return `${root}::${subfolder ?? "skillet"}`;
}

function getNamespaceMap(root = "applicationSupport", subfolder = "skillet"): Map<string, unknown> {
  const key = keyFor(root, subfolder);
  let files = stores.get(key);
  if (!files) {
    files = new Map<string, unknown>();
    stores.set(key, files);
  }
  return files;
}

function settingsKey(subfolder: string, filename: string): string {
  return `skillet:${subfolder}:${filename}`;
}

export async function hydrateStorage(subfolder = "skillet"): Promise<void> {
  const files = getNamespaceMap("applicationSupport", subfolder);
  await Promise.all(
    KNOWN_FILES.map(async (filename) => {
      try {
        const raw = await settings.get(settingsKey(subfolder, filename));
        if (raw !== null && raw !== undefined) {
          files.set(filename, typeof raw === "string" ? JSON.parse(raw) : raw);
        }
      } catch {
        // Ignore corrupt or missing keys on startup.
      }
    }),
  );
}

export function createStorage({
  root = "applicationSupport",
  subfolder = "skillet",
}: {
  root?: string;
  subfolder?: string;
} = {}): Storage {
  const files = getNamespaceMap(root, subfolder);
  return {
    read<T>(relativePath: string): T | undefined {
      if (!files.has(relativePath)) return undefined;
      return files.get(relativePath) as T;
    },
    write(relativePath: string, value: unknown): void {
      files.set(relativePath, value);
      void settings.set(settingsKey(subfolder, relativePath), JSON.stringify(value)).catch(() => {});
    },
  };
}

export function resetStorageCacheForTests(): void {
  stores.clear();
}
