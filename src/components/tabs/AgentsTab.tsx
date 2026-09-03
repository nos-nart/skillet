import React, { useState, useEffect } from "react";
import * as stylex from "@stylexjs/stylex";
import { RobotIcon, PackageIcon } from "@phosphor-icons/react";
import { Badge } from "../ui/badge.tsx";
import { SUPPORTED_AGENTS, AgentConfig } from "../../backend/agents.ts";
import { api } from "../../client/apiClient.ts";
import {
  CursorLogo,
  AnthropicLogo,
  GeminiLogo,
  CopilotLogo,
  WindsurfLogo
} from "../AgentLogos.tsx";
import { colors } from "../../tokens.stylex.ts";

const styles = stylex.create({
  main: {
    width: "100%",
    height: "100%",
    padding: "32px 36px",
    backgroundColor: colors.bgPrimary,
    overflowY: "auto",
  },
  container: {
    maxWidth: 780,
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    lineHeight: 1.2,
  },
  desc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 1.5,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: 14,
  },
  agentCard: {
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: 18,
    paddingRight: 18,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    transitionProperty: "transform, border-color, box-shadow",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-out",
    ":hover": {
      transform: "translateY(-1.5px)",
      borderColor: colors.borderSubtle,
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
    },
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1ch",
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    minWidth: 0,
  },
  agentName: {
    fontSize: 13.5,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  agentPath: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textMuted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
});

function getAgentLogo(id: string) {
  const s = { width: 22, height: 22, flexShrink: 0 };
  switch (id) {
    case "claude-code":
      return <AnthropicLogo style={{ ...s, color: "#D97757" }} />;
    case "cursor":
      return <CursorLogo style={{ ...s, color: colors.textPrimary }} />;
    case "gemini":
    case "antigravity":
      return <GeminiLogo style={{ ...s, color: "#4285F4" }} />;
    case "copilot":
      return <CopilotLogo style={{ ...s, color: colors.textPrimary }} />;
    case "windsurf":
      return <WindsurfLogo style={{ ...s, color: "rgb(20,184,166)" }} />;
    case "opencode":
      return <img src="/opencode.svg" style={{ ...s, objectFit: "contain" }} alt="OpenCode" />;
    default:
      return <PackageIcon weight="light" style={{ ...s, color: colors.textMuted }} />;
  }
}

export function AgentsTab() {
  const [agents, setAgents] = useState<AgentConfig[]>(SUPPORTED_AGENTS);

  useEffect(() => {
    api.getAgents().then(setAgents).catch(() => {});
  }, []);

  return (
    <main {...stylex.props(styles.main)}>
      <div {...stylex.props(styles.container)}>
        <div>
          <h2 {...stylex.props(styles.title)}>
            <RobotIcon weight="light" style={{ width: 24, height: 24, flexShrink: 0 }} />
            Detected Coding Agents
          </h2>
          <p {...stylex.props(styles.desc)}>
            Active AI coding agents and their standard skill discovery locations on your system.
          </p>
        </div>

        <div {...stylex.props(styles.grid)}>
          {agents.map((agent) => (
            <div key={agent.id} {...stylex.props(styles.agentCard)}>
              <div {...stylex.props(styles.cardTop)}>
                <div {...stylex.props(styles.cardLeft)}>
                  {getAgentLogo(agent.id)}
                  <span {...stylex.props(styles.agentName)}>{agent.name}</span>
                </div>
                <Badge variant={agent.status === "Active" ? "success" : "secondary"}>
                  {agent.status}
                </Badge>
              </div>
              <p {...stylex.props(styles.agentPath)}>
                ~/{agent.globalDirName}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
