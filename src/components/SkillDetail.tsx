import React, { useState } from "react";
import {
  Sparkle,
  GitBranch,
  ArrowsClockwise,
  Terminal,
} from "@phosphor-icons/react";
import { Skill, Workspace } from "../types/skills.ts";
import { MarkdownViewer } from "./MarkdownViewer.tsx";
import { Button } from "./ui/button.tsx";
import { Badge } from "./ui/badge.tsx";
import { Switch } from "./ui/switch.tsx";
import { Card, CardContent } from "./ui/card.tsx";
import { Separator } from "./ui/separator.tsx";

interface SkillDetailProps {
  skill: Skill | null;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onToggleInRepo: (ws: Workspace, enable: boolean) => Promise<void>;
  onUpdateSkill?: (skill: Skill) => Promise<void>;
}

export function SkillDetail({
  skill,
  workspaces,
  selectedWorkspace: _selectedWorkspace,
  onToggleInRepo,
  onUpdateSkill,
}: SkillDetailProps) {
  const [updating, setUpdating] = useState(false);
  const [toggleState, setToggleState] = useState<Record<string, boolean>>({});

  if (!skill) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center text-zinc-600 h-full p-6 text-center bg-zinc-950 select-none">
        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800/80 flex items-center justify-center mb-3 text-zinc-700">
          <Sparkle weight="light" className="w-6 h-6" />
        </div>
        <h3 className="text-xs font-semibold text-zinc-400">No skill selected</h3>
        <p className="text-[11px] text-zinc-600 mt-1 max-w-xs">
          Select a skill from the center list to view instructions, tools, and toggle per-repository activation.
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

  return (
    <main className="flex-1 bg-zinc-950 flex flex-col h-full overflow-y-auto">
      {/* Header Banner */}
      <div className="p-6 border-b border-zinc-800/80 bg-zinc-900/20 flex items-start justify-between shrink-0">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-inner">
              <Sparkle weight="light" className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-zinc-100">{skill.name}</h2>
                <Badge variant={skill.scope === "global" ? "secondary" : "default"}>
                  {skill.scope === "global" ? "Global" : "Project"}
                </Badge>
                {skill.metadata.trigger && (
                  <Badge variant="accent" className="font-mono">
                    {skill.metadata.trigger}
                  </Badge>
                )}
                {skill.isSymlink && (
                  <Badge variant="info">
                    Symlinked
                  </Badge>
                )}
              </div>
              <p className="text-xs text-zinc-400 mt-1 leading-normal">
                {skill.metadata.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {skill.updateAvailable && (
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold shadow-md shadow-amber-500/20 gap-1.5"
            >
              <ArrowsClockwise
                weight="light"
                className={`w-3.5 h-3.5 ${updating ? "animate-spin" : ""}`}
              />
              <span>{updating ? "Updating..." : "Update to Latest"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-6 space-y-6 flex-1 max-w-4xl">
        {/* Metadata Grid */}
        <Card className="bg-zinc-900/50">
          <CardContent className="p-4 grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Source Package
              </span>
              <span className="text-zinc-200 font-mono text-xs truncate block">{skill.packageName}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Agent Target
              </span>
              <span className="text-zinc-200 capitalize font-medium">{skill.agent}</span>
            </div>
            <div>
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Tools Used
              </span>
              <span className="text-zinc-300 text-xs font-mono">
                {skill.metadata.tools && skill.metadata.tools.length > 0
                  ? skill.metadata.tools.join(", ")
                  : "None"}
              </span>
            </div>
            <div className="col-span-3 pt-2 border-t border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase font-bold tracking-wider mb-0.5">
                Path on Disk
              </span>
              <span className="text-zinc-400 font-mono text-[11px] truncate block select-all">
                {skill.path}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Per-Repository Switchboard */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <GitBranch weight="light" className="w-3.5 h-3.5 text-orange-400" />
              Per-Repository Activation Switchboard
            </h3>
            <span className="text-[11px] text-zinc-500">Symlinks managed automatically</span>
          </div>

          <div className="border border-zinc-800 rounded-xl overflow-hidden divide-y divide-zinc-800/80 bg-zinc-900/30">
            {workspaces.map((ws) => {
              const isGlobal = ws.id === "global";
              const isChecked = toggleState[ws.id] ?? (isGlobal || skill.scope === "global");

              return (
                <div
                  key={ws.id}
                  className="px-4 py-3 flex items-center justify-between hover:bg-zinc-900/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${isGlobal ? "bg-amber-500/10 text-amber-400" : "bg-sky-500/10 text-sky-400"}`}>
                      <GitBranch weight="light" className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">{ws.name}</span>
                        {isGlobal && (
                          <Badge variant="secondary" className="text-[9px] px-1.5 uppercase font-mono font-bold">
                            All Repos
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 truncate block mt-0.5">
                        {ws.path}
                      </span>
                    </div>
                  </div>

                  <Switch
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      setToggleState((prev) => ({ ...prev, [ws.id]: checked }));
                      onToggleInRepo(ws, checked);
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* SKILL.md Markdown Preview */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
              <Terminal weight="light" className="w-3.5 h-3.5 text-emerald-400" />
              SKILL.md Documentation & Prompts
            </h3>
            <span className="text-[11px] font-mono text-zinc-500">Live Preview</span>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-6 shadow-inner">
            <MarkdownViewer content={skill.rawMarkdown || "# No body content in SKILL.md"} />
          </div>
        </div>
      </div>
    </main>
  );
}
