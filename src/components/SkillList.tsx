import React, { useState, useDeferredValue } from "react";
import {
  MagnifyingGlass,
  ArrowsClockwise,
  ArrowCircleUp,
  CaretRight,
  Package,
  Plus,
} from "@phosphor-icons/react";
import { Skill } from "../types/skills.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Badge } from "./ui/badge.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Separator } from "./ui/separator.tsx";

interface SkillListProps {
  skills: Skill[];
  selectedSkill: Skill | null;
  onSelectSkill: (skill: Skill) => void;
  onCheckUpdates: () => void;
  onRescan: () => void;
  onNewSkill?: () => void;
  isLoading: boolean;
  isCheckingUpdates?: boolean;
}

export function SkillList({
  skills,
  selectedSkill,
  onSelectSkill,
  onCheckUpdates,
  onRescan,
  onNewSkill,
  isLoading,
  isCheckingUpdates,
}: SkillListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredQuery = useDeferredValue(searchQuery);

  const filteredSkills = skills.filter((s) => {
    const q = deferredQuery.trim().toLowerCase();
    if (!q) return true;
    const name = (s.name || "").toLowerCase();
    const slug = (s.slug || "").toLowerCase();
    const pkg = (s.packageName || "").toLowerCase();
    const trigger = (s.metadata?.trigger || `/${s.slug || ""}`).toLowerCase();
    const desc = (s.metadata?.description || "").toLowerCase();
    const tools = (s.metadata?.tools || []).join(" ").toLowerCase();
    const agent = (s.agent || "").toLowerCase();
    return (
      name.includes(q) ||
      slug.includes(q) ||
      pkg.includes(q) ||
      trigger.includes(q) ||
      desc.includes(q) ||
      tools.includes(q) ||
      agent.includes(q)
    );
  });

  // Group by package
  const grouped = filteredSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const pkg = skill.packageName || "Global skills";
    if (!acc[pkg]) acc[pkg] = [];
    acc[pkg].push(skill);
    return acc;
  }, {});

  const updateCount = skills.filter((s) => s.updateAvailable).length;

  return (
    <section className="w-full h-full bg-zinc-50 dark:bg-zinc-900/60 flex flex-col select-none overflow-hidden">
      {/* Top action toolbar */}
      <div className="p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{skills.length} skills</span>
            {updateCount > 0 && (
              <Badge variant="warning" className="px-2 py-0.5 text-xs rounded-lg animate-in fade-in duration-200">
                {updateCount} update{updateCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onNewSkill && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNewSkill}
                title="Add custom skill from GitHub or local folder"
                className="h-8 text-xs gap-1 px-2.5"
              >
                <Plus weight="light" className="w-4 h-4 text-orange-500" />
                <span>New</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onCheckUpdates}
              disabled={isCheckingUpdates}
              title="Check for updates"
              className="h-8 text-xs gap-1 px-2.5"
            >
              <ArrowCircleUp
                weight="light"
                className={`w-4 h-4 text-orange-500 transition-transform ${isCheckingUpdates ? "animate-spin" : ""}`}
              />
              <span>{isCheckingUpdates ? "Checking..." : "Updates"}</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onRescan}
              disabled={isLoading}
              title="Rescan local directories"
              className="h-8 w-8"
            >
              <ArrowsClockwise
                weight="light"
                className={`w-4 h-4 text-orange-500 transition-transform ${isLoading ? "animate-spin" : "hover:rotate-45"}`}
              />
            </Button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <MagnifyingGlass
            weight="light"
            className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3 top-2.5 pointer-events-none"
          />
          <Input
            type="text"
            placeholder="Search skills and prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs h-8.5 bg-white dark:bg-zinc-950/80 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors"
          />
        </div>
      </div>

      <Separator />

      {/* Grouped Skills List */}
      <ScrollArea className="flex-1 p-2.5">
        <div className="space-y-4">
          {Object.keys(grouped).length === 0 ? (
            <div className="p-6 text-center text-zinc-400 dark:text-zinc-500 text-xs">
              {skills.length === 0 ? "No skills detected yet." : "No matching skills found."}
            </div>
          ) : (
            Object.entries(grouped).map(([pkgName, pkgSkills]) => (
              <div key={pkgName} className="space-y-1.5">
                <div className="px-2.5 py-1 flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400 tracking-wide">
                  <div className="flex items-center gap-1.5 truncate">
                    <Package weight="light" className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                    <span className="truncate">{pkgName}</span>
                  </div>
                  <span className="text-zinc-400 dark:text-zinc-600 font-mono text-xs shrink-0 ml-1">{pkgSkills.length}</span>
                </div>

                <div className="space-y-1">
                  {pkgSkills.map((skill) => {
                    const isSelected = selectedSkill?.id === skill.id;
                    return (
                      <button
                        key={skill.id}
                        onClick={() => onSelectSkill(skill)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors duration-100 flex items-center justify-between group cursor-pointer ${
                          isSelected
                            ? "bg-orange-500/10 text-orange-600 dark:text-orange-200 border border-orange-500/30"
                            : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100"
                        }`}
                      >
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-mono font-semibold truncate">
                              {skill.metadata?.trigger || `/${skill.slug}`}
                            </span>
                            {skill.updateAvailable && (
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 truncate mt-0.5">
                            {skill.metadata?.description || skill.name}
                          </p>
                        </div>
                        <CaretRight
                          weight="light"
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            isSelected ? "text-orange-500" : "text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-600 dark:group-hover:text-zinc-400"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </section>
  );
}
