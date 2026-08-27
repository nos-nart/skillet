import React from "react";
import { Terminal } from "@phosphor-icons/react";
import { Skill } from "../../types/skills.ts";
import { Badge } from "../ui/badge.tsx";

interface PromptsTabProps {
  skills: Skill[];
}

export function PromptsTab({ skills }: PromptsTabProps) {
  return (
    <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
      <div className="max-w-3xl space-y-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Terminal weight="light" className="w-5 h-5 text-emerald-400" />
            Prompt & Trigger Catalog
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            All slash commands and triggers defined across your installed skills.
          </p>
        </div>

        <div className="space-y-2">
          {skills.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No skills or triggers detected yet.
            </div>
          ) : (
            skills.map((skill) => (
              <div
                key={skill.id}
                className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg flex items-center justify-between hover:bg-zinc-900/60 transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 font-semibold">
                    {skill.metadata.trigger || `/${skill.slug}`}
                  </span>
                  <div>
                    <span className="text-xs font-semibold text-zinc-200">{skill.name}</span>
                    <span className="text-[11px] text-zinc-500 ml-2">
                      {skill.metadata.description || "No description"}
                    </span>
                  </div>
                </div>
                <Badge variant="secondary" className="font-mono text-[10px]">
                  {skill.packageName}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
