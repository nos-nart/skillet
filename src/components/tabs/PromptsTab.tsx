import React, { useState } from "react";
import {
  Terminal,
  MagnifyingGlass,
  Copy,
  Check,
  Wrench,
  Package,
} from "@phosphor-icons/react";
import { Skill } from "../../types/skills.ts";
import { Badge } from "../ui/badge.tsx";
import { Input } from "../ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card.tsx";

interface PromptsTabProps {
  skills: Skill[];
}

export function PromptsTab({ skills }: PromptsTabProps) {
  const [search, setSearch] = useState("");
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  const copyToClipboard = (trigger: string) => {
    navigator.clipboard.writeText(trigger);
    setCopiedTrigger(trigger);
    setTimeout(() => {
      setCopiedTrigger((prev) => (prev === trigger ? null : prev));
    }, 2000);
  };

  const filtered = skills.filter((s) => {
    const q = search.toLowerCase();
    const trigger = (s.metadata.trigger || `/${s.slug}`).toLowerCase();
    const name = s.name.toLowerCase();
    const desc = (s.metadata.description || "").toLowerCase();
    const tools = (s.metadata.tools || []).join(" ").toLowerCase();
    const agent = s.agent.toLowerCase();
    return (
      trigger.includes(q) ||
      name.includes(q) ||
      desc.includes(q) ||
      tools.includes(q) ||
      agent.includes(q)
    );
  });

  return (
    <main className="flex-1 p-6 bg-zinc-950 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header and Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-5">
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              <Terminal weight="light" className="w-5 h-5 text-emerald-400" />
              Prompt & Slash Command Catalog
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Browse, search, and copy triggers across all your installed skills.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <MagnifyingGlass
              weight="light"
              className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Filter triggers, tools, agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs bg-zinc-900/90"
            />
          </div>
        </div>

        {/* Responsive Grid */}
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 text-xs">
            {skills.length === 0 ? "No skills or prompts detected yet." : "No prompts matching your search."}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((skill) => {
              const trigger = skill.metadata.trigger || `/${skill.slug}`;
              const isCopied = copiedTrigger === trigger;

              return (
                <Card
                  key={skill.id}
                  className="bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700/80 hover:bg-zinc-900/60 transition-all flex flex-col justify-between group"
                >
                  <CardHeader className="p-4 pb-2 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => copyToClipboard(trigger)}
                        title="Click to copy trigger"
                        className="inline-flex items-center gap-1.5 font-mono text-xs text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 px-2 py-1 rounded transition-colors cursor-pointer"
                      >
                        <span className="font-semibold">{trigger}</span>
                        {isCopied ? (
                          <Check weight="bold" className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy weight="light" className="w-3 h-3 text-orange-400/80 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
                      </button>

                      <Badge variant="secondary" className="capitalize text-[10px]">
                        {skill.agent}
                      </Badge>
                    </div>

                    <CardTitle className="text-xs font-semibold text-zinc-200 truncate">
                      {skill.name}
                    </CardTitle>

                    <CardDescription className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {skill.metadata.description || "No description provided."}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 border-t border-zinc-800/40 mt-2 space-y-2">
                    {/* Tools and Package Info */}
                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <div className="flex items-center gap-1 truncate max-w-[180px]">
                        <Package weight="light" className="w-3 h-3 shrink-0" />
                        <span className="truncate font-mono">{skill.packageName}</span>
                      </div>

                      {skill.metadata.tools && skill.metadata.tools.length > 0 && (
                        <div className="flex items-center gap-1 text-zinc-400 font-mono">
                          <Wrench weight="light" className="w-3 h-3 text-zinc-500" />
                          <span>{skill.metadata.tools.length} tool{skill.metadata.tools.length > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
