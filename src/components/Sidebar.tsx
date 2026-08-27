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
} from "@phosphor-icons/react";
import { Workspace } from "../types/skills.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Badge } from "./ui/badge.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Separator } from "./ui/separator.tsx";
import { api } from "../client/apiClient.ts";

export type NavTab = "skills" | "agents" | "prompts" | "settings";

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
        // Fallback to manual text input if dialog was cancelled or unsupported
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
    <aside className="w-full h-full bg-zinc-950/90 dark:bg-zinc-950/90 light:bg-zinc-50 border-r border-zinc-800/80 flex flex-col select-none shrink-0 overflow-hidden">
      {/* App Header */}
      <div className="p-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img
            src="/icon.png"
            alt="Skillet Icon"
            className="w-8 h-8 rounded-lg shadow-md object-cover border border-zinc-800"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <h1 className="text-xs font-bold text-zinc-100 tracking-tight flex items-center gap-1.5">
              <span>Skillet</span>
              <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-orange-500/10 text-orange-400 border border-orange-500/20">
                v1.0
              </span>
            </h1>
            <p className="text-[10px] text-zinc-500">Universal Skills & Prompts</p>
          </div>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 rounded-md transition-colors cursor-pointer"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <Sun weight="light" className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon weight="light" className="w-4 h-4 text-sky-400" />
            )}
          </button>
        )}
      </div>

      <Separator />

      {/* Workspace Selector */}
      <div className="p-3">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
            Scope / Workspace
          </label>
          <button
            onClick={handlePickFolder}
            disabled={isPickingFolder}
            className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-1 transition cursor-pointer font-medium"
            title="Choose workspace folder from Finder"
          >
            <FolderSimplePlus weight="light" className="w-3.5 h-3.5" />
            <span>{isPickingFolder ? "Opening..." : "Add Folder"}</span>
          </button>
        </div>

        {isAddingManually && (
          <div className="mb-2 p-2 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
            <Input
              type="text"
              placeholder="/path/to/my-repo"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="flex justify-end gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingManually(false)}
                className="h-6 px-2 text-[11px]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveManual}
                className="h-6 px-2 text-[11px]"
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
            className="w-full bg-zinc-900/90 border border-zinc-800 text-zinc-200 text-xs rounded-md px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500/50 pr-8 truncate"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.path.replace(/^\/Users\/[^/]+/, "~")})
              </option>
            ))}
          </select>
          <GitBranch weight="light" className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      <Separator />

      {/* Navigation items */}
      <ScrollArea className="flex-1 p-2">
        <nav className="space-y-1">
          <button
            onClick={() => setCurrentTab("skills")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentTab === "skills"
                ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Sparkle weight="light" className="w-4 h-4 text-orange-400" />
              <span>Skills</span>
            </div>
            <Badge variant="secondary" className="font-mono px-1.5 py-0 text-[10px]">
              {skillsCount}
            </Badge>
          </button>

          <button
            onClick={() => setCurrentTab("agents")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentTab === "agents"
                ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Robot weight="light" className="w-4 h-4 text-sky-400" />
              <span>Agents</span>
            </div>
          </button>

          <button
            onClick={() => setCurrentTab("prompts")}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
              currentTab === "prompts"
                ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
                : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Terminal weight="light" className="w-4 h-4 text-emerald-400" />
              <span>Prompts</span>
            </div>
          </button>
        </nav>
      </ScrollArea>

      <Separator />

      {/* Settings at bottom */}
      <div className="p-2">
        <button
          onClick={() => setCurrentTab("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all cursor-pointer ${
            currentTab === "settings"
              ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/40"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <GearSix weight="light" className="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
