import React, { useState } from "react";
import { GearSix } from "@phosphor-icons/react";
import { Card, CardContent } from "../ui/card.tsx";
import { Input } from "../ui/input.tsx";
import { Button } from "../ui/button.tsx";

export function SettingsTab() {
  const [token, setToken] = useState(localStorage.getItem("github_token") || "");
  const [saved, setSaved] = useState(false);

  const handleSaveToken = () => {
    localStorage.setItem("github_token", token.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <main className="w-full h-full p-8 bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <GearSix weight="light" className="w-5 h-5 text-zinc-500" />
            Settings & Preferences
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Configure GitHub API tokens, discovery directories, and runtime preferences.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                GitHub Personal Access Token (Optional)
              </label>
              <p className="text-[11px] text-zinc-500">
                Used to increase rate limits when discovering remote skills and checking for updates.
              </p>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                />
                <Button size="sm" onClick={handleSaveToken}>
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                Theme Appearance
              </label>
              <p className="text-[11px] text-zinc-500">
                Choose your preferred interface theme.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem("skillet_theme", "dark");
                    document.documentElement.classList.remove("light");
                    document.documentElement.classList.add("dark");
                  }}
                  className="text-xs"
                >
                  Dark Mode
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem("skillet_theme", "light");
                    document.documentElement.classList.remove("dark");
                    document.documentElement.classList.add("light");
                  }}
                  className="text-xs"
                >
                  Light Mode
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-200 block">
                Application Runtime
              </label>
              <p className="text-[11px] text-zinc-500">
                Skillet v1.0.0 (Deno Desktop Runtime · Vite 8 · Rolldown · comark · Shiki · Phosphor Icons)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
