import { useSyncExternalStore } from "react";
import { Uniwind, useUniwind } from "uniwind";
import { storageJsonStore, type JsonStore } from "./workspaces";

// Port of the old `useTheme` (`src/hooks/useTheme.ts`): system default is
// dark. Uniwind applies the theme to all className styling at runtime, so
// switching is a single `setAppTheme` call — no reload needed.
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

/** Apply the persisted theme at startup (call once, replaces bare setTheme). */
export function applyStoredTheme(store: JsonStore = storageJsonStore()): AppTheme {
  const theme = readStoredTheme(store);
  Uniwind.setTheme(theme);
  return theme;
}

export function useAppTheme(): AppTheme {
  return useSyncExternalStore(subscribe, () => getSnapshot());
}

// --- Icon palette -----------------------------------------------------------
// Phosphor icons take an explicit `color` prop (Uniwind text classes don't
// cascade into SVG fill), so resolve the same tokens as global.css here.

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
}

const DARK_PALETTE: ThemePalette = {
  background: "#121214",
  foreground: "#f5f5f7",
  muted: "#a1a1aa",
  surface: "#1a1a1e",
  surfaceMuted: "#222226",
  border: "#2e2e34",
  primary: "#0A84FF",
  accent: "#0A84FF",
  danger: "#f87171",
  white: "#ffffff",
};

const LIGHT_PALETTE: ThemePalette = {
  background: "#ffffff",
  foreground: "#111827",
  muted: "#6b7280",
  surface: "#ffffff",
  surfaceMuted: "#f8fafc",
  border: "#e2e8f0",
  primary: "#007AFF",
  accent: "#007AFF",
  danger: "#b42318",
  white: "#ffffff",
};

export function themePalette(theme: AppTheme): ThemePalette {
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}

/** Palette for the current Uniwind theme (re-renders on theme switch). */
export function useThemePalette(): ThemePalette {
  const { theme } = useUniwind();
  return theme === "dark" ? DARK_PALETTE : LIGHT_PALETTE;
}
