import { storageJsonStore, type JsonStore } from "./workspaces";

// Shared app settings persisted next to workspaces.json (ports the old
// `localStorage` keys: `github_token`, `skillet_theme` — theme itself lives in
// services/theme.ts but shares the same settings.json file).
const SETTINGS_FILE = "settings.json";

function readSettings(store: JsonStore): Record<string, unknown> {
  try {
    return store.readJson<Record<string, unknown>>(SETTINGS_FILE) ?? {};
  } catch {
    return {};
  }
}

export function getGithubToken(store: JsonStore = storageJsonStore()): string | undefined {
  const raw = readSettings(store)["github_token"];
  return typeof raw === "string" && raw.trim() !== "" ? raw : undefined;
}

export function saveGithubToken(token: string, store: JsonStore = storageJsonStore()): void {
  const prev = readSettings(store);
  store.writeJson(SETTINGS_FILE, { ...prev, github_token: token.trim() });
}
