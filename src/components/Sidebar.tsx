import React, { useState } from "react";
import { Sparkles, Bot, Terminal, Settings, FolderGit2, Plus } from "lucide-react";
import { Workspace } from "../types/skills.ts";

export type NavTab = "skills" | "agents" | "prompts" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  skillsCount: number;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  onAddWorkspace?: (ws: Workspace) => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  skillsCount,
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  onAddWorkspace,
}: SidebarProps) {
  const [isAddingWs, setIsAddingWs] = useState(false);
  const [newWsPath, setNewWsPath] = useState("");

  const handleAddWorkspace = () => {
    if (!newWsPath.trim()) return;
    const path = newWsPath.trim();
    const name = path.split("/").filter(Boolean).pop() || path;
    if (onAddWorkspace) {
      onAddWorkspace({
        id: `ws-${Date.now()}`,
        name,
        path,
        isCurrent: false,
      });
    }
    setNewWsPath("");
    setIsAddingWs(false);
  };

  return (
    <aside className="w-64 bg-zinc-950/90 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col h-full select-none shrink-0">
      {/* App Header */}
      <div className="p-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Sparkles className="w-4 h-4 text-zinc-950 font-black" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">Skillet</h1>
          <p className="text-[11px] text-zinc-500">Skills & Prompts</p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div className="p-3 border-b border-zinc-800/40">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 block">
            Scope / Workspace
          </label>
          <button
            onClick={() => setIsAddingWs(!isAddingWs)}
            className="text-[10px] text-orange-400 hover:text-orange-300 flex items-center gap-0.5 transition"
            title="Add local Git repository"
          >
            <Plus className="w-3 h-3" />
            <span>Add</span>
          </button>
        </div>

        {isAddingWs && (
          <div className="mb-2 p-2 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
            <input
              type="text"
              placeholder="/path/to/my-repo"
              value={newWsPath}
              onChange={(e) => setNewWsPath(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 text-zinc-200 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={() => setIsAddingWs(false)}
                className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddWorkspace}
                className="px-2 py-0.5 text-[11px] bg-orange-500 text-zinc-950 font-medium rounded hover:bg-orange-400"
              >
                Save
              </button>
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
                {ws.name} ({ws.path.replace(/^\/Users\/[^\/]+/, "~")})
              </option>
            ))}
          </select>
          <FolderGit2 className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 p-2 space-y-1">
        <button
          onClick={() => setCurrentTab("skills")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "skills"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Skills</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {skillsCount}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab("agents")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "agents"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Bot className="w-4 h-4 text-sky-400" />
            <span>Agents</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab("prompts")}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "prompts"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm border border-zinc-700/40"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Prompts</span>
          </div>
        </button>
      </nav>

      {/* Settings at bottom */}
      <div className="p-2 border-t border-zinc-800/60">
        <button
          onClick={() => setCurrentTab("settings")}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "settings"
              ? "bg-zinc-800/90 text-zinc-100 border border-zinc-700/40"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
