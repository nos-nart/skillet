import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { SparkleIcon,
  RobotIcon,
  TerminalIcon,
  GearSixIcon,
  GitBranchIcon,
  FolderSimplePlusIcon,
  SunIcon,
  MoonIcon,
  CompassIcon, } from "@phosphor-icons/react";
import { Workspace } from "../types/skills.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Badge } from "./ui/badge.tsx";
import { Separator } from "./ui/separator.tsx";
import { colors, iconSizes } from "../tokens.stylex.ts";
import { api } from "../client/apiClient.ts";

const styles = stylex.create({
  aside: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.bgSecondary,
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
    flexShrink: 0,
    overflow: "hidden",
  },
  header: {
    padding: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  logo: {
    width: 32,
    height: 32,
    objectFit: "contain" as const,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.textPrimary,
    letterSpacing: "-0.01em",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  versionBadge: {
    fontSize: 10,
    fontFamily: "monospace",
    fontWeight: 700,
    paddingLeft: 6,
    paddingRight: 6,
    paddingTop: 1,
    paddingBottom: 1,
    borderRadius: 4,
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    color: colors.primary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "rgba(249, 115, 22, 0.3)",
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  themeBtn: {
    padding: 8,
    color: colors.textMuted,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    borderRadius: 0,
    cursor: "pointer",
    transitionProperty: "color, background-color",
    transitionDuration: "150ms",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    ":hover": {
      color: colors.textPrimary,
      backgroundColor: colors.bgTertiary,
    },
    ":active": {
      transform: "scale(0.95)",
    },
  },
  scopeSection: {
    padding: 12,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  scopeHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 4,
    paddingRight: 4,
    height: 20,
  },
  scopeLabel: {
    fontSize: 11,
    textTransform: "uppercase" as const,
    fontWeight: 600,
    letterSpacing: "0.05em",
    color: colors.textMuted,
    lineHeight: 1,
  },
  addBtn: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    whiteSpace: "nowrap" as const,
    transitionProperty: "color, transform",
    transitionDuration: "150ms",
    cursor: "pointer",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    padding: 0,
    ":hover": {
      color: colors.primaryHover,
    },
    ":active": {
      transform: "scale(0.95)",
    },
  },
  addForm: {
    padding: 10,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  addFormActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 6,
  },
  manualInput: {
    height: 32,
    fontSize: 12,
    fontFamily: "monospace",
  },
  selectWrapper: {
    position: "relative" as const,
  },
  select: {
    width: "100%",
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: 500,
    borderRadius: 8,
    paddingLeft: 12,
    paddingRight: 32,
    paddingTop: 8,
    paddingBottom: 8,
    appearance: "none",
    cursor: "pointer",
    outline: "none",
    transitionProperty: "border-color",
    transitionDuration: "150ms",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    ":focus": {
      boxShadow: "0 0 0 1px var(--color-orange-500)",
    },
  },
  selectIcon: {
    position: "absolute" as const,
    right: 10,
    top: 10,
    pointerEvents: "none" as const,
    color: colors.textMuted,
  },
  nav: {
    flex: 1,
    padding: 8,
  },
  navList: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    listStyle: "none",
    padding: 0,
    margin: 0,
  },
  navItem: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 0,
    fontSize: 13,
    fontWeight: 500,
    transitionProperty: "background-color, color, transform, box-shadow",
    transitionDuration: "150ms",
    cursor: "pointer",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    textAlign: "left" as const,
    ":active": {
      transform: "scale(0.98)",
    },
  },
  navItemActive: {
    backgroundColor: colors.bgTertiary,
    color: colors.textPrimary,
    fontWeight: 600,
    boxShadow: "inset -2px 0 0 var(--color-orange-500)",
  },
  navItemInactive: {
    color: colors.textSecondary,
    ":hover": {
      backgroundColor: colors.bgHover,
      color: colors.textPrimary,
    },
  },
  navItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  footer: {
    padding: 8,
  },
});

export type NavTab = "skills" | "discover" | "agents" | "prompts" | "settings";

interface SidebarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
  skillsCount: number;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
  onAddWorkspace?: (ws: Workspace) => void;
  theme?: "dark" | "light";
  onToggleTheme?: () => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  skillsCount,
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
  onAddWorkspace,
  theme = "dark",
  onToggleTheme,
}: SidebarProps) {
  const [isAddingManually, setIsAddingManually] = useState(false);
  const [manualPath, setManualPath] = useState("");
  const [isPickingFolder, setIsPickingFolder] = useState(false);

  const handlePickFolder = async () => {
    setIsPickingFolder(true);
    try {
      const res = await api.pickFolder();
      if (res.ok && res.path) {
        const name = res.name || res.path.split("/").filter(Boolean).pop() || "Workspace";
        if (onAddWorkspace) {
          onAddWorkspace({
            id: `ws-${Date.now()}`,
            name,
            path: res.path,
            isCurrent: false,
          });
        }
      } else {
        setIsAddingManually(true);
      }
    } catch {
      setIsAddingManually(true);
    } finally {
      setIsPickingFolder(false);
    }
  };

  const handleSaveManual = () => {
    if (!manualPath.trim()) return;
    const path = manualPath.trim();
    const name = path.split("/").filter(Boolean).pop() || path;
    if (onAddWorkspace) {
      onAddWorkspace({
        id: `ws-${Date.now()}`,
        name,
        path,
        isCurrent: false,
      });
    }
    setManualPath("");
    setIsAddingManually(false);
  };

  const navItems = [
    { tab: "skills" as const, icon: SparkleIcon, label: "Skills", count: skillsCount },
    { tab: "discover" as const, icon: CompassIcon, label: "Discover" },
    { tab: "agents" as const, icon: RobotIcon, label: "Agents" },
    { tab: "prompts" as const, icon: TerminalIcon, label: "Prompts" },
  ];

  return (
    <aside {...stylex.props(styles.aside)}>
      <div {...stylex.props(styles.header)}>
        <div {...stylex.props(styles.headerLeft)}>
          <img
            src="/logo.svg"
            alt="Skillet Icon"
            {...stylex.props(styles.logo)}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div>
            <div {...stylex.props(styles.title)}>
              <span>Skillet</span>
              <span {...stylex.props(styles.versionBadge)}>v1.0</span>
            </div>
            <p {...stylex.props(styles.subtitle)}>Universal Skills & Prompts</p>
          </div>
        </div>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            {...stylex.props(styles.themeBtn)}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? (
              <SunIcon weight="light" style={iconSizes.md} />
            ) : (
              <MoonIcon weight="light" style={iconSizes.md} />
            )}
          </button>
        )}
      </div>

      <Separator />

      <div {...stylex.props(styles.scopeSection)}>
        <div {...stylex.props(styles.scopeHeader)}>
          <span {...stylex.props(styles.scopeLabel)}>Scope / Workspace</span>
          <button
            type="button"
            onClick={handlePickFolder}
            disabled={isPickingFolder}
            {...stylex.props(styles.addBtn)}
            title="Choose workspace folder from Finder"
          >
            <FolderSimplePlusIcon weight="light" style={{ width: 16, height: 16, flexShrink: 0, color: colors.primary }} />
            <span>{isPickingFolder ? "Opening..." : "Add Folder"}</span>
          </button>
        </div>

        {isAddingManually && (
          <div {...stylex.props(styles.addForm)}>
            <Input
              type="text"
              placeholder="/path/to/my-repo"
              value={manualPath}
              onChange={(e) => setManualPath(e.target.value)}
              {...stylex.props(styles.manualInput)}
            />
            <div {...stylex.props(styles.addFormActions)}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAddingManually(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveManual}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        <div {...stylex.props(styles.selectWrapper)}>
          <select
            value={selectedWorkspace?.id || "global"}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) onSelectWorkspace(ws);
            }}
            {...stylex.props(styles.select)}
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name} ({ws.path.replace(/^\/Users\/[^/]+/, "~")})
              </option>
            ))}
          </select>
          <GitBranchIcon weight="light" style={{ width: 16, height: 16 }} {...stylex.props(styles.selectIcon)} />
        </div>
      </div>

      <Separator />

      <nav {...stylex.props(styles.nav)}>
        <div {...stylex.props(styles.navList)}>
          {navItems.map(({ tab, icon: Icon, label, count }) => (
            <button
              key={tab}
              onClick={() => setCurrentTab(tab)}
              {...stylex.props(
                styles.navItem,
                currentTab === tab ? styles.navItemActive : styles.navItemInactive,
              )}
            >
              <div {...stylex.props(styles.navItemLeft)}>
                <Icon weight="light" style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{label}</span>
              </div>
              {count !== undefined && (
                <Badge variant="secondary">
                  {count}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </nav>

      <Separator />

      <div {...stylex.props(styles.footer)}>
        <button
          onClick={() => setCurrentTab("settings")}
          {...stylex.props(
            styles.navItem,
            currentTab === "settings" ? styles.navItemActive : styles.navItemInactive,
          )}
        >
          <div {...stylex.props(styles.navItemLeft)}>
            <GearSixIcon weight="light" style={{ width: 18, height: 18, flexShrink: 0, color: colors.textSecondary }} />
            <span>Settings</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
