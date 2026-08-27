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
    <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
      <div className="max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <GearSix weight="light" className="w-5 h-5 text-zinc-400" />
            Settings & Preferences
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Configure GitHub API tokens, discovery directories, and runtime preferences.
          </p>
        </div>

        <div className="space-y-4 text-xs">
          <Card className="bg-zinc-900/50">
            <CardContent className="p-4 space-y-3">
              <label className="text-xs font-semibold text-zinc-200 block">
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
                  className="bg-zinc-950"
                />
                <Button size="sm" onClick={handleSaveToken}>
                  {saved ? "Saved!" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900/50">
            <CardContent className="p-4 space-y-2">
              <label className="text-xs font-semibold text-zinc-200 block">
                Application Runtime
              </label>
              <p className="text-[11px] text-zinc-500">
                Skillet v1.0.0 (Deno Desktop Runtime · Vite 8 · Rolldown · comark)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
