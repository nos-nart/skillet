import React, { useState } from "react";
import { GearSixIcon, SunIcon, MoonIcon } from "@phosphor-icons/react";
import { Card, CardContent } from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";
import { useTheme } from "../../hooks/useTheme.ts";

export function SettingsTab() {
  const [token, setToken] = useState(localStorage.getItem("github_token") || "");
  const [saved, setSaved] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSaveToken = () => {
    localStorage.setItem("github_token", token.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="size-full p-8 bg-white dark:bg-zinc-950 overflow-y-auto animate-view-in">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <GearSixIcon weight="light" className="size-6 text-zinc-500" />
            Settings & Preferences
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Configure GitHub API tokens, discovery directories, and runtime preferences.
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 block">
                GitHub Personal Access Token (Optional)
              </label>
              <p className="text-sm text-zinc-500">
                Used to increase rate limits when discovering remote skills and checking for updates.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono"
                />
                <Button size="sm" onClick={handleSaveToken}>
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 block">
                Theme Appearance
              </label>
              <p className="text-sm text-zinc-500">
                Choose your preferred interface theme.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  className="gap-1.5"
                >
                  <MoonIcon weight="light" className="size-4" />
                  <span>Dark Mode</span>
                </Button>
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  className="gap-1.5"
                >
                  <SunIcon weight="light" className="size-4" />
                  <span>Light Mode</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-2">
              <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-200 block">
                Application Runtime
              </label>
              <p className="text-sm text-zinc-500">
                Skillet v1.0.0 (Deno Desktop Runtime · Vite 8 · Rolldown · Space Grotesk · comark · Shiki · Phosphor Icons)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
