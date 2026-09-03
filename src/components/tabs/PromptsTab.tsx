import React, { useState, useDeferredValue } from "react";
import * as stylex from "@stylexjs/stylex";
import { TerminalIcon,
  MagnifyingGlassIcon,
  CopyIcon,
  CheckIcon,
  WrenchIcon,
  PackageIcon, } from "@phosphor-icons/react";
import { Skill } from "../../types/skills.ts";
import { Badge } from "../ui/badge.tsx";
import { Input } from "../ui/input.tsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card.tsx";
import { colors, iconSizes } from "../../tokens.stylex.ts";

const styles = stylex.create({
  main: {
    width: "100%",
    height: "100%",
    padding: 32,
    backgroundColor: colors.bgPrimary,
    overflowY: "auto",
  },
  container: {
    maxWidth: 1152,
    marginLeft: "auto",
    marginRight: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },
  header: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 16,
    paddingBottom: 20,
    borderBottom: `1px solid ${colors.borderDefault}`,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchWrapper: {
    position: "relative" as const,
    width: "100%",
  },
  searchIcon: {
    position: "absolute" as const,
    left: 12,
    top: 10,
    pointerEvents: "none" as const,
    color: colors.textMuted,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
  },
  empty: {
    padding: 48,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12,
  },
  triggerBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontFamily: "monospace",
    fontSize: 12,
    color: colors.primaryHover,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.primaryBorder,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 4,
    paddingBottom: 4,
    borderRadius: 8,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    cursor: "pointer",
    ":active": {
      transform: "scale(0.95)",
    },
  },
  cardHeader: {
    padding: 16,
    paddingBottom: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  cardTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardContent: {
    padding: 16,
    paddingTop: 8,
    borderTop: `1px solid ${colors.borderSubtle}`,
    marginTop: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 14,
    color: colors.textSecondary,
  },
  toolCount: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontFamily: "monospace",
  },
});

interface PromptsTabProps {
  skills: Skill[];
}

export function PromptsTab({ skills }: PromptsTabProps) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  const copyToClipboard = (trigger: string) => {
    navigator.clipboard.writeText(trigger);
    setCopiedTrigger(trigger);
    setTimeout(() => { setCopiedTrigger((prev) => (prev === trigger ? null : prev)); }, 2000);
  };

  const filtered = skills.filter((s) => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return true;
    const trigger = (s.metadata?.trigger || `/${s.slug}`).toLowerCase();
    const name = (s.name || "").toLowerCase();
    const desc = (s.metadata?.description || "").toLowerCase();
    const tools = (s.metadata?.tools || []).join(" ").toLowerCase();
    const agent = (s.agent || "").toLowerCase();
    return trigger.includes(q) || name.includes(q) || desc.includes(q) || tools.includes(q) || agent.includes(q);
  });

  return (
    <main {...stylex.props(styles.main)}>
      <div {...stylex.props(styles.container)}>
        <div {...stylex.props(styles.header)}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <h2 {...stylex.props(styles.title)}>
                <TerminalIcon weight="light" style={{ ...iconSizes.xl, color: colors.primary }} />
                Prompt & Slash Command Catalog
              </h2>
              <p {...stylex.props(styles.desc)}>Browse, search, and copy triggers across all your installed skills.</p>
            </div>
            <div {...stylex.props(styles.searchWrapper)}>
              <MagnifyingGlassIcon weight="light" {...stylex.props(styles.searchIcon)} style={iconSizes.md} />
              <Input
                type="text"
                placeholder="Filter triggers, tools, agents..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ paddingLeft: 36, height: 34, width: "100%", backgroundColor: colors.bgSecondary, borderColor: colors.borderDefault }}
              />
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div {...stylex.props(styles.empty)}>
            {skills.length === 0 ? "No skills or prompts detected yet." : "No prompts matching your search."}
          </div>
        ) : (
          <div {...stylex.props(styles.grid)}>
            {filtered.map((skill) => {
              const trigger = skill.metadata.trigger || `/${skill.slug}`;
              const isCopied = copiedTrigger === trigger;
              return (
                <Card key={skill.id}>
                  <CardHeader {...stylex.props(styles.cardHeader)}>
                    <div {...stylex.props(styles.cardTop)}>
                      <button
                        onClick={() => copyToClipboard(trigger)}
                        title="Click to copy trigger"
                        {...stylex.props(styles.triggerBtn)}
                      >
                        <span style={{ fontWeight: 600 }}>{trigger}</span>
                        {isCopied ? (
                          <CheckIcon weight="bold" style={{ ...iconSizes.sm, color: colors.success }} />
                        ) : (
                          <CopyIcon weight="light" style={{ ...iconSizes.sm, opacity: 0.6 }} />
                        )}
                      </button>
                      <Badge variant="secondary">{skill.agent}</Badge>
                    </div>
                    <CardTitle>{skill.name}</CardTitle>
                    <CardDescription>{skill.metadata.description || "No description provided."}</CardDescription>
                  </CardHeader>
                  <CardContent {...stylex.props(styles.cardContent)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, overflow: "hidden" }}>
                      <PackageIcon weight="light" style={{ ...iconSizes.sm, flexShrink: 0 }} />
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "monospace" }}>{skill.packageName}</span>
                    </div>
                    {skill.metadata.tools && skill.metadata.tools.length > 0 && (
                      <div {...stylex.props(styles.toolCount)}>
                        <WrenchIcon weight="light" style={{ ...iconSizes.sm, color: colors.textMuted }} />
                        <span>{skill.metadata.tools.length} tool{skill.metadata.tools.length > 1 ? "s" : ""}</span>
                      </div>
                    )}
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
