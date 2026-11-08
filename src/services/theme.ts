import { useSyncExternalStore } from "react";
import { Uniwind, useUniwind } from "uniwind";
import { storageJsonStore, type JsonStore } from "./workspaces";

export type AppTheme = "dark" | "light";

const SETTINGS_FILE = "settings.json";
const DEFAULT_THEME: AppTheme = "dark";

type ThemeListener = () => void;
const listeners = new Set<ThemeListener>();

function notify(): void {
  for (const l of listeners) l();
}

function subscribe(listener: ThemeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function readStoredTheme(store: JsonStore): AppTheme {
  try {
    const parsed = store.readJson<{ theme?: unknown }>(SETTINGS_FILE);
    if (parsed?.theme === "light" || parsed?.theme === "dark") return parsed.theme;
  } catch {
    // Fall through to default.
  }
  return DEFAULT_THEME;
}

function getSnapshot(store: JsonStore = storageJsonStore()): AppTheme {
  return readStoredTheme(store);
}

export function getAppTheme(store: JsonStore = storageJsonStore()): AppTheme {
  return readStoredTheme(store);
}

export function setAppTheme(theme: AppTheme, store: JsonStore = storageJsonStore()): void {
  try {
    const prev = store.readJson<Record<string, unknown>>(SETTINGS_FILE) ?? {};
    store.writeJson(SETTINGS_FILE, { ...prev, theme });
  } catch {
    // Persist best-effort; the live theme still applies.
  }
  Uniwind.setTheme(theme);
  notify();
}

export function toggleAppTheme(store: JsonStore = storageJsonStore()): AppTheme {
  const next: AppTheme = readStoredTheme(store) === "dark" ? "light" : "dark";
  setAppTheme(next, store);
  return next;
}

export function applyStoredTheme(store: JsonStore = storageJsonStore()): AppTheme {
  const theme = readStoredTheme(store);
  Uniwind.setTheme(theme);
  return theme;
}

export function useAppTheme(): AppTheme {
  return useSyncExternalStore(subscribe, () => getSnapshot());
}

export interface ThemePalette {
  background: string;
  foreground: string;
  muted: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  primary: string;
  accent: string;
  danger: string;
  white: string;
  isDark: boolean;
}

export const DARK_PALETTE: ThemePalette = {
  background: "#0D0E11",
  foreground: "#F5F5F7",
  muted: "#8E939E",
  surface: "#181B20",
  surfaceMuted: "#131519",
  border: "#262A33",
  primary: "#0A84FF",
  accent: "#0A84FF",
  danger: "#FF453A",
  white: "#FFFFFF",
  isDark: true,
};

export const LIGHT_PALETTE: ThemePalette = {
  background: "#F5F6F8",
  foreground: "#111827",
  muted: "#646B78",
  surface: "#FFFFFF",
  surfaceMuted: "#ECEEF2",
  border: "#DFE2E8",
  primary: "#007AFF",
  accent: "#007AFF",
  danger: "#D92D20",
  white: "#FFFFFF",
  isDark: false,
};

export function themePalette(theme: AppTheme): ThemePalette {
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

export function useThemePalette(): ThemePalette {
  const { theme } = useUniwind();
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}
