// In-memory stand-in for `@legend-apps/storage`, wired via
// `jest.config.cjs` moduleNameMapper. Implements just the `Storage` surface
// the services use (`read`/`write` with `{ format: "json" }`), keyed by
// root/subfolder/relative path so tests stay isolated per subfolder.
type JsonOptions = { format: "json" };

const stores = new Map<string, Map<string, unknown>>();

function keyFor(root: string, subfolder: string | undefined): string {
  return `${root}::${subfolder ?? ""}`;
}

export function createStorage({
  root = "applicationSupport",
  subfolder,
}: {
  root?: string;
  subfolder?: string;
} = {}): {
  read<T>(relativePath: string, options: JsonOptions): T | undefined;
  write(relativePath: string, value: unknown, options: JsonOptions): void;
} {
  const key = keyFor(root, subfolder);
  let files = stores.get(key);
  if (!files) {
    files = new Map<string, unknown>();
    stores.set(key, files);
  }
  return {
    read<T>(relativePath: string, _options: JsonOptions): T | undefined {
      if (!files.has(relativePath)) return undefined;
      // SAFETY: in-memory mock round-trips the exact value services wrote
      return files.get(relativePath) as T;
    },
    write(relativePath: string, value: unknown, _options: JsonOptions): void {
      files.set(relativePath, value);
    },
  };
}

export function __resetStorageMock(): void {
  stores.clear();
}
