import React, { useState, useEffect } from "react";
import { Robot } from "@phosphor-icons/react";
import { Badge } from "../ui/badge.tsx";
import { Card, CardContent } from "../ui/card.tsx";
import { SUPPORTED_AGENTS, AgentConfig } from "../../backend/agents.ts";
import { api } from "../../client/apiClient.ts";

export function AgentsTab() {
  const [agents, setAgents] = useState<AgentConfig[]>(SUPPORTED_AGENTS);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  return (
    <main className="w-full h-full p-8 bg-white dark:bg-zinc-950 overflow-y-auto">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <Robot weight="light" className="w-6 h-6 text-sky-500" />
            Detected Coding Agents
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Active AI coding agents and their standard skill discovery locations on your system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id}>
              <CardContent className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{agent.icon}</span>
                    <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">{agent.name}</span>
                  </div>
                  <Badge variant={agent.status === "Active" ? "success" : "secondary"} className="rounded-lg text-xs">
                    {agent.status}
                  </Badge>
                </div>
                <p className="text-xs font-mono text-zinc-500 truncate">
                  ~/{agent.globalDirName}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
