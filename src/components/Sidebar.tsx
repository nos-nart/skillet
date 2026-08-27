import React, { useState } from "react";
import {
  Sparkle,
  Robot,
  Terminal,
  GearSix,
  GitBranch,
  FolderSimplePlus,
  Sun,
  Moon,
  Compass,
} from "@phosphor-icons/react";
import { Workspace } from "../types/skills.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Badge } from "./ui/badge.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Separator } from "./ui/separator.tsx";
import { api } from "../client/apiClient.ts";

export type NavTab = "skills" | "discover" | "agents" | "prompts" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  skillsCount: number;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  onAddWorkspace?: (ws: Workspace) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  skillsCount,
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  onAddWorkspace,
  theme = "dark",
  onToggleTheme,
}: SidebarProps) {
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  const handlePickFolder = async () => {
    setIsPickingFolder(true);
    try {
      const res = await api.pickFolder();
      if (res.ok && res.path) {
        const name = res.name || res.path.split("/").filter(Boolean).pop() || "Workspace";
        if (onAddWorkspace) {
          onAddWorkspace({
            id: `ws-${Date.now()}`,
            name,
            path: res.path,
            isCurrent: false,
          });
        }
      } else {
        setIsAddingManually(true);
      }
    } catch {
      setIsAddingManually(true);
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleSaveManual = () => {
    if (!manualPath.trim()) return;
    const path = manualPath.trim();
    const name = path.split("/").filter(Boolean).pop() || path;
    if (onAddWorkspace) {
      onAddWorkspace({
        id: `ws-${Date.now()}`,
        name,
        path,
        isCurrent: false,
      });
    }
    setManualPath("");
    setIsAddingManually(false);
  };

  return (
    <aside className="w-full h-full bg-zinc-100/90 dark:bg-zinc-950 flex flex-col select-none shrink-0 overflow-hidden">
      {/* App Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/icon.png"
            alt="Skillet Icon"
            className="w-9 h-9 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-1.5 font-sans">
              <span>Skillet</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 font-mono">
                v1.0
              </span>
            </h1>
            <p className="text-xs text-zinc-500">Universal Skills & Prompts</p>
          </div>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-900 rounded-lg transition-transform duration-200 active:rotate-45 active:scale-90 cursor-pointer"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun weight="light" className="w-5 h-5 text-amber-400 transition-transform duration-200" />
            ) : (
              <Moon weight="light" className="w-5 h-5 text-sky-500 transition-transform duration-200" />
            )}
          </button>
        )}
      </div>

      <Separator />

      {/* Workspace Selector */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between px-1 h-5">
          <span className="text-[11px] uppercase font-bold tracking-wider text-zinc-500 leading-none flex items-center">
            Scope / Workspace
          </span>
          <button
            type="button"
            onClick={handlePickFolder}
            disabled={isPickingFolder}
            className="text-xs text-orange-600 dark:text-orange-400 hover:text-orange-500 flex items-center gap-1.5 leading-none transition-transform duration-150 active:scale-95 cursor-pointer font-medium"
            title="Choose workspace folder from Finder"
          >
            <FolderSimplePlus weight="light" className="w-4 h-4 shrink-0" />
            <span className="leading-none">{isPickingFolder ? "Opening..." : "Add Folder"}</span>
          </button>
        </div>

        {isAddingManually && (
          <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2 animate-in fade-in-50 zoom-in-95 duration-150">
            <Input
              type="text"
              placeholder="/path/to/my-repo"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              className="h-8 text-xs font-mono"
            />
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingManually(false)}
                className="h-7 px-2.5 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveManual}
                className="h-7 px-2.5 text-xs"
              >
                Save
              </Button>
            </div>
          </div>
        )}

        <div className="relative">
          <select
            value={selectedWorkspace?.id || "global"}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) onSelectWorkspace(ws);
            }}
            className="w-full bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-200 text-xs font-medium rounded-lg px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500/50 pr-8 truncate transition-colors"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.path.replace(/^\/Users\/[^/]+/, "~")})
              </option>
            ))}
          </select>
          <GitBranch weight="light" className="w-4 h-4 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      <Separator />

      {/* Navigation items */}
      <ScrollArea className="flex-1 p-2.5">
        <nav className="space-y-1.5">
          <button
            onClick={() => setCurrentTab("skills")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              currentTab === "skills"
                ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Sparkle weight="light" className="w-4.5 h-4.5 text-orange-500" />
              <span>Skills</span>
            </div>
            <Badge variant="secondary" className="font-mono px-2 py-0.5 text-xs rounded-lg">
              {skillsCount}
            </Badge>
          </button>

          <button
            onClick={() => setCurrentTab("discover")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              currentTab === "discover"
                ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Compass weight="light" className="w-4.5 h-4.5 text-fuchsia-500" />
              <span>Discover</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab("agents")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              currentTab === "agents"
                ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Robot weight="light" className="w-4.5 h-4.5 text-sky-500" />
              <span>Agents</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab("prompts")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
              currentTab === "prompts"
                ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <Terminal weight="light" className="w-4.5 h-4.5 text-emerald-500" />
              <span>Prompts</span>
            </div>
          </button>
        </nav>
      </ScrollArea>

      <Separator />

      {/* Settings at bottom */}
      <div className="p-2.5">
        <button
          onClick={() => setCurrentTab("settings")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 active:scale-[0.98] cursor-pointer ${
            currentTab === "settings"
              ? "bg-zinc-200/60 dark:bg-zinc-800/60 text-zinc-900 dark:text-zinc-100"
              : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/40 dark:hover:bg-zinc-800/40 hover:text-zinc-900 dark:hover:text-zinc-200"
          }`}
        >
          <GearSix weight="light" className="w-4.5 h-4.5 text-zinc-500" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
