import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { SparkleIcon,
  GitBranchIcon,
  ArrowsClockwiseIcon,
  TerminalIcon,
  TrashIcon,
  ArrowSquareOutIcon,
  DownloadSimpleIcon, } from "@phosphor-icons/react";
import { Skill, Workspace } from "../types/skills.ts";
import { MarkdownViewer } from "./MarkdownViewer.tsx";
import { Button } from "./ui/button.tsx";
import { Badge } from "./ui/badge.tsx";
import { Switch } from "./ui/switch.tsx";
import { ConfirmDialog } from "./ConfirmDialog.tsx";
import { colors, iconSizes } from "../tokens.stylex.ts";

const styles = stylex.create({
  main: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.bgPrimary,
    display: "flex",
    flexDirection: "column",
    position: "relative",
    overflow: "hidden",
  },
  empty: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: colors.textMuted,
    padding: 24,
    textAlign: "center",
    backgroundColor: colors.bgPrimary,
    userSelect: "none",
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderSubtle,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    color: colors.textMuted,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: "-0.01em",
  },
  emptyDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
    maxWidth: 260,
    lineHeight: 1.6,
  },
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 20,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgPrimary,
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    flexShrink: 0,
    backdropFilter: "blur(24px)",
  },
  headerLeft: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    maxWidth: 672,
  },
  headerTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap" as const,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: "-0.01em",
  },
  headerDesc: {
    fontSize: 13.5,
    color: colors.textSecondary,
    lineHeight: 1.5,
  },
  headerActions: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  scrollArea: {
    flex: 1,
    overflowY: "auto" as const,
  },
  content: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 20,
    maxWidth: 896,
    marginLeft: "auto",
    marginRight: "auto",
  },
  metaCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgSecondary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
    overflow: "hidden",
  },
  metaGrid: {
    padding: 20,
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 16,
    fontSize: 12,
  },
  metaLabel: {
    fontSize: 10,
    textTransform: "uppercase" as const,
    fontWeight: 700,
    letterSpacing: "0.08em",
    color: colors.textMuted,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    color: colors.textPrimary,
  },
  metaValueMono: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.textPrimary,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  metaLink: {
    fontSize: 12,
    fontFamily: "monospace",
    color: colors.primaryHover,
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    textDecoration: "none",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    transitionProperty: "color",
    transitionDuration: "150ms",
    ":hover": {
      color: colors.primary,
    },
  },
  metaCol2: {
    gridColumn: "span 2",
  },
  metaCol3: {
    gridColumn: "span 3",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderDefault,
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  workspaceList: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.bgSecondary,
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.03)",
  },
  workspaceItem: {
    padding: "12px 16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomStyle: "solid",
    borderBottomColor: colors.borderSubtle,
    transitionProperty: "background-color",
    transitionDuration: "150ms",
    ":hover": {
      backgroundColor: colors.bgHover,
    },
  },
  workspaceItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  workspaceIcon: {
    padding: 8,
    borderRadius: 8,
  },
  workspaceIconGlobal: {
    backgroundColor: colors.warningSoft,
    color: colors.warningHover,
  },
  workspaceIconLocal: {
    backgroundColor: colors.infoSoft,
    color: colors.infoHover,
  },
  workspaceName: {
    fontSize: 13,
    fontWeight: 600,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  workspacePath: {
    fontSize: 11,
    fontFamily: "monospace",
    color: colors.textMuted,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    marginTop: 2,
  },
  markdownArea: {
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: 8,
    padding: 20,
  },
  truncate: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  sectionStack: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
});

interface SkillDetailProps {
  skill: Skill | null;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onToggleInRepo: (ws: Workspace, enable: boolean) => Promise<void>;
  onUpdateSkill?: (skill: Skill) => Promise<void>;
  onUninstallSkill?: (skill: Skill) => Promise<void>;
  onInstallSkill?: (skill: Skill) => Promise<void>;
}

type ActionState = "idle" | "updating" | "uninstalling" | "installing";

export function SkillDetail({
  skill,
  workspaces,
  selectedWorkspace: _selectedWorkspace,
  onToggleInRepo,
  onUpdateSkill,
  onUninstallSkill,
  onInstallSkill,
}: SkillDetailProps) {
  const [action, setAction] = useState<ActionState>("idle");
  const [isConfirmUninstallOpen, setIsConfirmUninstallOpen] = useState(false);
  const [optimisticToggles, setOptimisticToggles] = useState<Record<string, boolean>>({});

  if (!skill) {
    return (
      <main {...stylex.props(styles.empty)}>
        <div {...stylex.props(styles.emptyIcon)}>
          <SparkleIcon weight="light" style={iconSizes.xxl} />
        </div>
        <h3 {...stylex.props(styles.emptyTitle)}>No skill selected</h3>
        <p {...stylex.props(styles.emptyDesc)}>
          Select a skill from the list to view instructions, tools, and manage workspace activation.
        </p>
      </main>
    );
  }

  const updating = action === "updating";
  const uninstalling = action === "uninstalling";
  const installing = action === "installing";

  const handleUpdate = async () => {
    if (!onUpdateSkill) return;
    setAction("updating");
    try {
      await onUpdateSkill(skill);
    } finally {
      setAction("idle");
    }
  };

  const handleConfirmUninstall = async () => {
    if (!onUninstallSkill) return;
    setAction("uninstalling");
    try {
      await onUninstallSkill(skill);
      setIsConfirmUninstallOpen(false);
    } finally {
      setAction("idle");
    }
  };

  const handleUninstall = () => {
    setIsConfirmUninstallOpen(true);
  };

  const handleInstall = async () => {
    if (!onInstallSkill) return;
    setAction("installing");
    try {
      await onInstallSkill(skill);
    } finally {
      setAction("idle");
    }
  };

  return (
    <main key={skill.id} {...stylex.props(styles.main)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerLeft)}>
          <div {...stylex.props(styles.headerTitleRow)}>
            <h2 {...stylex.props(styles.headerTitle)}>{skill.name}</h2>
            <Badge variant={skill.scope === "global" ? "secondary" : "default"}>
              {skill.scope === "global" ? "Global" : "Project"}
            </Badge>
            {skill.metadata.trigger && (
              <Badge variant="accent">
                {skill.metadata.trigger}
              </Badge>
            )}
            {skill.isSymlink && (
              <Badge variant="info">
                Symlinked
              </Badge>
            )}
          </div>
          <p {...stylex.props(styles.headerDesc)}>
            {skill.metadata.description || "No description provided."}
          </p>
        </div>

        <div {...stylex.props(styles.headerActions)}>
          {skill.updateAvailable && (
            <Button
              onClick={handleUpdate}
              disabled={updating}
              style={{ backgroundColor: colors.warning, color: colors.textDark, fontWeight: 600, gap: "1ch", fontSize: 12 }}
            >
              <ArrowsClockwiseIcon
                weight="light"
                style={{ width: 16, height: 16 }}
                className={updating ? "animate-spin" : ""}
              />
              <span>{updating ? "Updating..." : "Update"}</span>
            </Button>
          )}

          {onInstallSkill && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleInstall}
              disabled={installing}
            >
              <DownloadSimpleIcon weight="light" style={{ width: 16, height: 16, color: colors.primary }} />
              <span>{installing ? "Installing..." : "Install"}</span>
            </Button>
          )}

          {onUninstallSkill && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleUninstall}
              disabled={uninstalling}
            >
              <TrashIcon weight="light" style={{ width: 16, height: 16 }} />
              <span>{uninstalling ? "Removing..." : "Uninstall"}</span>
            </Button>
          )}
        </div>
      </div>
      
      <div {...stylex.props(styles.scrollArea)}>
        <div {...stylex.props(styles.content)}>
        <div {...stylex.props(styles.metaCard)}>
          <div {...stylex.props(styles.metaGrid)}>
            <div>
              <div {...stylex.props(styles.metaLabel)}>Source Package</div>
              <span {...stylex.props(styles.metaValueMono)}>{skill.packageName}</span>
            </div>
            <div>
              <div {...stylex.props(styles.metaLabel)}>Agent Target</div>
              <span {...stylex.props(styles.metaValue)} style={{ textTransform: "capitalize" }}>{skill.agent}</span>
            </div>
            <div>
              <div {...stylex.props(styles.metaLabel)}>Provider</div>
              <Badge variant={skill.provider === "github" ? "accent" : "secondary"}>
                {skill.provider || "local"}
              </Badge>
            </div>

            <div>
              <div {...stylex.props(styles.metaLabel)}>Tools Used</div>
              <span {...stylex.props(styles.metaValueMono)}>
                {skill.metadata.tools && skill.metadata.tools.length > 0
                  ? skill.metadata.tools.join(", ")
                  : "None"}
              </span>
            </div>

            <div {...stylex.props(styles.metaCol2)}>
              <div {...stylex.props(styles.metaLabel)}>Source Repository / URL</div>
              {skill.sourceUrl ? (
                <a
                  href={skill.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  {...stylex.props(styles.metaLink)}
                >
                  <span {...stylex.props(styles.truncate)}>{skill.sourceUrl}</span>
                  <ArrowSquareOutIcon weight="light" style={{ width: 14, height: 14, flexShrink: 0 }} />
                </a>
              ) : (
                <span {...stylex.props(styles.metaValueMono)} style={{ color: colors.textSecondary }}>Local Directory</span>
              )}
            </div>

            <div {...stylex.props(styles.metaCol3)}>
              <div {...stylex.props(styles.metaLabel)}>Path on Disk</div>
              <span {...stylex.props(styles.metaValueMono)} style={{ color: colors.textSecondary, userSelect: "all" }}>
                {skill.path}
              </span>
            </div>
          </div>
        </div>

        <div {...stylex.props(styles.sectionStack)}>
          <div {...stylex.props(styles.sectionHeader)}>
            <h3 {...stylex.props(styles.sectionTitle)}>
              <GitBranchIcon weight="light" style={{ width: 16, height: 16, color: colors.primary, flexShrink: 0 }} />
              Per-Repository Activation Switchboard
            </h3>
            <span {...stylex.props(styles.sectionSubtitle)}>Symlinks managed automatically</span>
          </div>

          <div {...stylex.props(styles.workspaceList)}>
            {workspaces.map((ws) => {
              const isGlobal = ws.id === "global";
              const isChecked = optimisticToggles[ws.id] ?? (isGlobal ? true : (skill.enabledInWorkspaces?.includes(ws.id) ?? false));

              return (
                <div
                  key={ws.id}
                  {...stylex.props(styles.workspaceItem)}
                >
                  <div {...stylex.props(styles.workspaceItemLeft)}>
                    <div {...stylex.props(styles.workspaceIcon, isGlobal ? styles.workspaceIconGlobal : styles.workspaceIconLocal)}>
                      <GitBranchIcon weight="light" style={{ width: 18, height: 18, flexShrink: 0 }} />
                    </div>
                    <div>
                      <div {...stylex.props(styles.workspaceName)}>
                        <span>{ws.name}</span>
                        {isGlobal && (
                          <Badge variant="secondary" style={{ textTransform: "uppercase", fontFamily: "monospace", fontSize: 10, fontWeight: 700 }}>ALL REPOS</Badge>
                        )}
                      </div>
                      <span {...stylex.props(styles.workspacePath)}>
                        {ws.path}
                      </span>
                    </div>
                  </div>

                  {!isGlobal ? (
                    <Switch
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        setOptimisticToggles((prev) => ({ ...prev, [ws.id]: checked }));
                        onToggleInRepo(ws, checked);
                      }}
                    />
                  ) : (
                    <Badge variant="secondary">Active</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div {...stylex.props(styles.sectionStack)}>
          <div {...stylex.props(styles.sectionHeader)}>
            <h3 {...stylex.props(styles.sectionTitle)}>
              <TerminalIcon weight="light" style={{ width: 16, height: 16, color: colors.primary, flexShrink: 0 }} />
              SKILL.MD Documentation & Prompts
            </h3>
            <span {...stylex.props(styles.sectionSubtitle)} style={{ fontFamily: "monospace" }}>Live Preview</span>
          </div>
          <div {...stylex.props(styles.markdownArea)}>
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
