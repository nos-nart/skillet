import { useSyncExternalStore, useCallback, useEffect } from "react";

export type Theme = "dark" | "light";

const THEME_KEY = "skillet_theme";
const THEME_CHANGE_EVENT = "skillet_theme_change";
const DEFAULT_THEME: Theme = "dark";

function getThemeSnapshot(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    // Ignore fallback
  }
  return DEFAULT_THEME;
}

function subscribe(callback: () => void) {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === THEME_KEY) {
      callback();
    }
  };
  const handleCustom = () => {
    callback();
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(THEME_CHANGE_EVENT, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, handleCustom);
  };
}

export function applyThemeToDom(theme: Theme) {
  if (!globalThis.document) return;
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.remove("dark");
    root.classList.add("light");
  } else {
    root.classList.remove("light");
    root.classList.add("dark");
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getThemeSnapshot, () => DEFAULT_THEME);

  useEffect(() => {
    applyThemeToDom(theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch {
      // Ignore
    }
    applyThemeToDom(newTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
