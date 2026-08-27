import React, { useState } from "react";
import { Search, RefreshCw, ArrowUpCircle, ChevronRight, Package, Sparkles } from "lucide-react";
import { Skill } from "../types/skills.ts";

interface SkillListProps {
  skills: Skill[];
  selectedSkill: Skill | null;
  onSelectSkill: (skill: Skill) => void;
  onCheckUpdates: () => void;
  onRescan: () => void;
  isLoading: boolean;
  isCheckingUpdates?: boolean;
}

export function SkillList({
  skills,
  selectedSkill,
  onSelectSkill,
  onCheckUpdates,
  onRescan,
  isLoading,
  isCheckingUpdates,
}: SkillListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSkills = skills.filter((s) =>
    (s.name && s.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.slug && s.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.packageName && s.packageName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.metadata?.trigger && s.metadata.trigger.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (s.metadata?.description && s.metadata.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Group by package
  const grouped = filteredSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const pkg = skill.packageName || "Global skills";
    if (!acc[pkg]) acc[pkg] = [];
    acc[pkg].push(skill);
    return acc;
  }, {});

  const updateCount = skills.filter((s) => s.updateAvailable).length;

  return (
    <section className="w-80 bg-zinc-900/60 backdrop-blur-md border-r border-zinc-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Top action toolbar */}
      <div className="p-3 border-b border-zinc-800/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-200">{skills.length} skills</span>
            {updateCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {updateCount} update{updateCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onCheckUpdates}
              disabled={isCheckingUpdates}
              title="Check for updates"
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 rounded text-[11px] font-medium transition flex items-center gap-1 border border-zinc-700/50"
            >
              <ArrowUpCircle className={`w-3 h-3 text-orange-400 ${isCheckingUpdates ? "animate-spin" : ""}`} />
              <span>{isCheckingUpdates ? "Checking..." : "Updates"}</span>
            </button>
            <button
              onClick={onRescan}
              disabled={isLoading}
              title="Rescan local directories"
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition border border-zinc-700/50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-orange-400" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search skills and prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/80 border border-zinc-800 text-zinc-200 text-xs rounded-md pl-8 pr-3 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* Grouped Skills List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs">
            {skills.length === 0 ? "No skills detected yet." : "No matching skills found."}
          </div>
        ) : (
          Object.entries(grouped).map(([pkgName, pkgSkills]) => (
            <div key={pkgName} className="space-y-1">
              <div className="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-zinc-400 tracking-wide">
                <div className="flex items-center gap-1.5 truncate">
                  <Package className="w-3 h-3 text-zinc-500 shrink-0" />
                  <span className="truncate">{pkgName}</span>
                </div>
                <span className="text-zinc-600 font-mono text-[10px] shrink-0 ml-1">{pkgSkills.length}</span>
              </div>

              <div className="space-y-0.5">
                {pkgSkills.map((skill) => {
                  const isSelected = selectedSkill?.id === skill.id;
                  return (
                    <button
                      key={skill.id}
                      onClick={() => onSelectSkill(skill)}
                      className={`w-full text-left px-2.5 py-2 rounded-md transition-all flex items-center justify-between group ${
                        isSelected
                          ? "bg-orange-500/15 text-orange-200 border border-orange-500/30 shadow-sm"
                          : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                      }`}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono font-medium truncate">
                            {skill.metadata?.trigger || `/${skill.slug}`}
                          </span>
                          {skill.updateAvailable && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                          {skill.metadata?.description || skill.name}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-3.5 h-3.5 transition-transform shrink-0 ${
                          isSelected ? "text-orange-400 translate-x-0.5" : "text-zinc-600 group-hover:text-zinc-400"
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
    </section>
  );
}
