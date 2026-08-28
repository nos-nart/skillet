import React, { useState, useEffect } from "react";
import { RobotIcon, PackageIcon, TerminalWindowIcon } from "@phosphor-icons/react";
import { Badge } from "../ui/badge.tsx";
import { Card, CardContent } from "../ui/card.tsx";
import { SUPPORTED_AGENTS, AgentConfig } from "../../backend/agents.ts";
import { api } from "../../client/apiClient.ts";
import {
  CursorLogo,
  AnthropicLogo,
  GeminiLogo,
  CopilotLogo,
  WindsurfLogo
} from "../AgentLogos.tsx";

function getAgentLogo(id: string) {
  const className = "size-6 shrink-0";
  switch (id) {
    case "claude-code":
      return <AnthropicLogo className={`${className} text-[#D97757]`} />;
    case "cursor":
      return <CursorLogo className={`${className} text-zinc-900 dark:text-zinc-100`} />;
    case "gemini":
    case "antigravity":
      return <GeminiLogo className={`${className} text-[#4285F4]`} />;
    case "copilot":
      return <CopilotLogo className={`${className} text-zinc-900 dark:text-zinc-100`} />;
    case "windsurf":
      return <WindsurfLogo className={`${className} text-teal-500`} />;
    case "opencode":
      return <img src="https://opencode.ai/_build/assets/preview-opencode-logo-light-B5i-Y4z2.png" className={`${className} object-contain`} alt="OpenCode" />;
    default:
      return <PackageIcon weight="light" className={`${className} text-zinc-400`} />;
  }
}

export function AgentsTab() {
  const [agents, setAgents] = useState<AgentConfig[]>(SUPPORTED_AGENTS);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  return (
    <main className="size-full p-8 bg-white dark:bg-zinc-950 overflow-y-auto animate-view-in">
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2.5">
            <RobotIcon weight="light" className="size-6 text-zinc-900 dark:text-zinc-100" />
            Detected Coding Agents
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Active AI coding agents and their standard skill discovery locations on your system.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:-translate-y-0.5 transition-transform duration-150 ease-out">
              <CardContent className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getAgentLogo(agent.id)}
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
