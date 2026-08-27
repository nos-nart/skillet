import React, { useState } from "react";
import {
  Sparkle,
  GitBranch,
  ArrowsClockwise,
  Terminal,
  Trash,
  ArrowSquareOut,
  DownloadSimple,
} from "@phosphor-icons/react";
import { Skill, Workspace } from "../types/skills.ts";
import { MarkdownViewer } from "./MarkdownViewer.tsx";
import { Button } from "./ui/button.tsx";
import { Badge } from "./ui/badge.tsx";
import { Switch } from "./ui/switch.tsx";
import { Card, CardContent } from "./ui/card.tsx";
import { ConfirmDialog } from "./ConfirmDialog.tsx";

interface SkillDetailProps {
  skill: Skill | null;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onToggleInRepo: (ws: Workspace, enable: boolean) => Promise<void>;
  onUpdateSkill?: (skill: Skill) => Promise<void>;
  onUninstallSkill?: (skill: Skill) => Promise<void>;
  onInstallSkill?: (skill: Skill) => Promise<void>;
}

export function SkillDetail({
  skill,
  workspaces,
  selectedWorkspace: _selectedWorkspace,
  onToggleInRepo,
  onUpdateSkill,
  onUninstallSkill,
  onInstallSkill,
}: SkillDetailProps) {
  const [updating, setUpdating] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [isConfirmUninstallOpen, setIsConfirmUninstallOpen] = useState(false);
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({});

  if (!skill) {
    return (
      <main className="w-full h-full flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-600 p-6 text-center bg-white dark:bg-zinc-950 select-none animate-view-in">
        <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/50 shadow-sm flex items-center justify-center mb-4 text-zinc-400 dark:text-zinc-500">
          <Sparkle weight="light" className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-zinc-800 dark:text-zinc-300 tracking-tight">No skill selected</h3>
        <p className="text-[13px] text-zinc-500 dark:text-zinc-500 mt-1.5 max-w-[260px] leading-relaxed">
          Select a skill from the list to view instructions, tools, and manage workspace activation.
        </p>
      </main>
    );
  }

  const handleUpdate = async () => {
    if (!onUpdateSkill) return;
    setUpdating(true);
    try {
      await onUpdateSkill(skill);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmUninstall = async () => {
    if (!onUninstallSkill) return;
    setUninstalling(true);
    try {
      await onUninstallSkill(skill);
      setIsConfirmUninstallOpen(false);
    } finally {
      setUninstalling(false);
    }
  };

  const handleUninstall = () => {
    setIsConfirmUninstallOpen(true);
  };

  const handleInstall = async () => {
    if (!onInstallSkill) return;
    setInstalling(true);
    try {
      await onInstallSkill(skill);
    } finally {
      setInstalling(false);
    }
  };

  return (
    <main key={skill.id} className="w-full h-full bg-white dark:bg-zinc-950 flex flex-col relative overflow-hidden animate-view-in">
      {/* Header Banner - Sticky & Translucent */}
      <div className="sticky top-0 z-20 p-6 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl flex items-start justify-between shrink-0 transition-colors">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{skill.name}</h2>
            <Badge variant={skill.scope === "global" ? "secondary" : "default"} className="rounded-lg">
              {skill.scope === "global" ? "Global" : "Project"}
            </Badge>
            {skill.metadata.trigger && (
              <Badge variant="accent" className="font-mono text-xs rounded-lg">
                {skill.metadata.trigger}
              </Badge>
            )}
            {skill.isSymlink && (
              <Badge variant="info" className="rounded-lg">
                Symlinked
              </Badge>
            )}
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {skill.metadata.description || "No description provided."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {skill.updateAvailable && (
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold gap-1.5"
            >
              <ArrowsClockwise
                weight="light"
                className={`w-4 h-4 ${updating ? "animate-spin" : ""}`}
              />
              <span>{updating ? "Updating..." : "Update to Latest"}</span>
            </Button>
          )}

          {onInstallSkill && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              disabled={installing}
              className="gap-1.5 text-xs"
            >
              <DownloadSimple weight="light" className="w-4 h-4 text-orange-500" />
              <span>{installing ? "Installing..." : "Install"}</span>
            </Button>
          )}

          {onUninstallSkill && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUninstall}
              disabled={uninstalling}
              className="gap-1.5 text-xs"
            >
              <Trash weight="light" className="w-4 h-4" />
              <span>{uninstalling ? "Removing..." : "Uninstall"}</span>
            </Button>
          )}
        </div>
      </div>
      
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Metadata Grid */}
        <Card>
          <CardContent className="p-5 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Source Package
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 font-mono text-xs truncate block">{skill.packageName}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Agent Target
              </span>
              <span className="text-zinc-800 dark:text-zinc-200 capitalize font-medium text-xs">{skill.agent}</span>
            </div>
            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Provider
              </span>
              <Badge variant={skill.provider === "github" ? "accent" : "secondary"} className="capitalize rounded-lg text-xs">
                {skill.provider || "local"}
              </Badge>
            </div>

            <div>
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Tools Used
              </span>
              <span className="text-zinc-700 dark:text-zinc-300 text-xs font-mono">
                {skill.metadata.tools && skill.metadata.tools.length > 0
                  ? skill.metadata.tools.join(", ")
                  : "None"}
              </span>
            </div>

            <div className="col-span-2">
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Source Repository / URL
              </span>
              {skill.sourceUrl ? (
                <a
                  href={skill.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 dark:text-orange-400 hover:text-orange-500 font-mono text-xs truncate flex items-center gap-1 transition-colors"
                >
                  <span className="truncate">{skill.sourceUrl}</span>
                  <ArrowSquareOut weight="light" className="w-3.5 h-3.5 shrink-0" />
                </a>
              ) : (
                <span className="text-zinc-500 font-mono text-xs">Local Directory</span>
              )}
            </div>

            <div className="col-span-3 pt-3 border-t border-zinc-200 dark:border-zinc-800/60">
              <span className="text-zinc-400 dark:text-zinc-500 block text-xs uppercase font-bold tracking-wider mb-0.5">
                Path on Disk
              </span>
              <span className="text-zinc-600 dark:text-zinc-400 font-mono text-xs truncate block select-all">
                {skill.path}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Per-Repository Switchboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <GitBranch weight="light" className="w-4 h-4 text-orange-500" />
              Per-Repository Activation Switchboard
            </h3>
            <span className="text-xs text-zinc-500">Symlinks managed automatically</span>
          </div>

          <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-200 dark:divide-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30">
            {workspaces.map((ws) => {
              const isGlobal = ws.id === "global";
              const isChecked = toggleState[ws.id] ?? (isGlobal ? true : (skill.enabledInWorkspaces?.includes(ws.id) ?? false));

              return (
                <div
                  key={ws.id}
                  className="px-4 py-3.5 flex items-center justify-between hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg ${isGlobal ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-sky-500/10 text-sky-600 dark:text-sky-400"}`}>
                      <GitBranch weight="light" className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ws.name}</span>
                        {isGlobal && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.2 uppercase font-mono font-bold rounded-lg">
                            All Repos
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs font-mono text-zinc-500 truncate block mt-0.5">
                        {ws.path}
                      </span>
                    </div>
                  </div>

                  {!isGlobal ? (
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setToggleState((prev) => ({ ...prev, [ws.id]: checked }));
                        onToggleInRepo(ws, checked);
                      }}
                    />
                  ) : (
                    <Badge variant="secondary" className="text-xs rounded-lg">Active</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SKILL.md Markdown Preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
              <Terminal weight="light" className="w-4 h-4 text-emerald-500" />
              SKILL.md Documentation & Prompts
            </h3>
            <span className="text-xs font-mono text-zinc-400 dark:text-zinc-500">Live Preview</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 rounded-lg p-6">
            <MarkdownViewer content={skill.rawMarkdown || "# No body content in SKILL.md"} />
          </div>
        </div>
      </div>
      </div>
      <ConfirmDialog
        isOpen={isConfirmUninstallOpen}
        title="Uninstall Skill"
        description={`Are you sure you want to uninstall '${skill.name}' from your system? This will delete the skill folder and unbind any active workspace symlinks.`}
        confirmLabel="Uninstall"
        variant="destructive"
        isLoading={uninstalling}
        onConfirm={handleConfirmUninstall}
        onCancel={() => setIsConfirmUninstallOpen(false)}
      />
    </main>
  );
}
