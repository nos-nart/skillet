import React, { useState, useDeferredValue } from "react";
import * as stylex from "@stylexjs/stylex";
import { MagnifyingGlassIcon,
  ArrowsClockwiseIcon,
  ArrowCircleUpIcon,
  CaretRightIcon,
  PackageIcon,
  PlusIcon, } from "@phosphor-icons/react";
import { Skill } from "../types/skills.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Badge } from "./ui/badge.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Separator } from "./ui/separator.tsx";
import { colors } from "../tokens.stylex.ts";

const styles = stylex.create({
  section: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.bgPanel,
    display: "flex",
    flexDirection: "column",
    userSelect: "none",
    overflow: "hidden",
  },
  toolbar: {
    padding: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  toolbarTop: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toolbarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  count: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.textPrimary,
  },
  toolbarActions: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  searchWrapper: {
    position: "relative" as const,
  },
  searchIcon: {
    position: "absolute" as const,
    left: 12,
    top: 10,
    pointerEvents: "none" as const,
    color: colors.textMuted,
  },
  searchInput: {
    paddingLeft: 36,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingLeft: 10,
    paddingRight: 6,
    paddingTop: 8,
    paddingBottom: 8,
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  groupHeader: {
    padding: "4px 8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontSize: 10,
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
    color: colors.textMuted,
  },
  groupHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
    overflow: "hidden",
  },
  groupCount: {
    color: colors.textMuted,
    fontFamily: "monospace",
    flexShrink: 0,
  },
  items: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
  },
  item: {
    width: "100%",
    textAlign: "left" as const,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 8,
    transitionProperty: "background-color",
    transitionDuration: "100ms",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundColor: "transparent",
  },
  itemSelected: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
    borderColor: "rgba(255, 255, 255, 0.15)",
    boxShadow: "0 1px 3px rgba(249, 115, 22, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
  },
  itemDefault: {
    color: colors.textPrimary,
    ":hover": {
      backgroundColor: colors.bgTertiary,
    },
  },
  itemContent: {
    minWidth: 0,
    flex: 1,
    paddingRight: 8,
  },
  itemTitleRow: {
    display: "flex",
    alignItems: "center",
    gap: "1ch",
  },
  itemTrigger: {
    fontSize: 13,
    fontFamily: "monospace",
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  itemTriggerSelected: {
    color: "#ffffff",
    fontWeight: 700,
  },
  itemTriggerDefault: {
    color: colors.textPrimary,
  },
  itemDesc: {
    fontSize: 12,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    marginTop: 2,
  },
  itemDescSelected: {
    color: "rgba(255,255,255,0.95)",
  },
  itemDescDefault: {
    color: colors.textSecondary,
  },
  updateDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    backgroundColor: colors.warningLight,
    flexShrink: 0,
  },
  caret: {
    width: 14,
    height: 14,
    flexShrink: 0,
    transitionProperty: "color",
    transitionDuration: "100ms",
  },
  caretSelected: {
    color: "#ffffff",
  },
  caretDefault: {
    color: colors.borderDefault,
  },
  empty: {
    padding: 24,
    textAlign: "center",
    color: colors.textMuted,
    fontSize: 12,
  },
  groupStack: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  pkgStack: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  truncate: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
});

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

  const grouped = filteredSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const pkg = skill.packageName || "Global skills";
    if (!acc[pkg]) acc[pkg] = [];
    acc[pkg].push(skill);
    return acc;
  }, {});

  const updateCount = skills.filter((s) => s.updateAvailable).length;

  return (
    <section {...stylex.props(styles.section)}>
      <div {...stylex.props(styles.toolbar)}>
        <div {...stylex.props(styles.toolbarTop)}>
          <div {...stylex.props(styles.toolbarLeft)}>
            <span {...stylex.props(styles.count)}>{skills.length} skills</span>
            {updateCount > 0 && (
              <Badge variant="warning">
                {updateCount} update{updateCount > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
          <div {...stylex.props(styles.toolbarActions)}>
            {onNewSkill && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onNewSkill}
                title="Add custom skill from GitHub or local folder"
              >
                <PlusIcon weight="light" style={{ width: 16, height: 16, flexShrink: 0, color: colors.primary }} />
                <span>New</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={onCheckUpdates}
              disabled={isCheckingUpdates}
              title="Check for updates"
            >
              <ArrowCircleUpIcon
                weight="light"
                style={{ width: 16, height: 16, flexShrink: 0, color: colors.primary }}
                className={isCheckingUpdates ? "animate-spin" : ""}
              />
              <span>{isCheckingUpdates ? "Checking..." : "Updates"}</span>
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={onRescan}
              disabled={isLoading}
              title="Rescan local directories"
            >
              <ArrowsClockwiseIcon
                weight="light"
                style={{ width: 16, height: 16, flexShrink: 0, color: colors.primary }}
                className={isLoading ? "animate-spin" : ""}
              />
            </Button>
          </div>
        </div>

        <div {...stylex.props(styles.searchWrapper)}>
          <MagnifyingGlassIcon
            weight="light"
            {...stylex.props(styles.searchIcon)}
            style={{ width: 16, height: 16 }}
          />
          <Input
            type="text"
            placeholder="Search skills and prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            {...stylex.props(styles.searchInput)}
          />
        </div>
      </div>

      <Separator />

      <ScrollArea
        {...stylex.props(styles.scrollArea)}
        contentStyle={stylex.props(styles.scrollContent).style}
      >
          <div {...stylex.props(styles.groupStack)}>
            {Object.keys(grouped).length === 0 ? (
            <div {...stylex.props(styles.empty)}>
              {skills.length === 0 ? "No skills detected yet." : "No matching skills found."}
            </div>
          ) : (
            Object.entries(grouped).map(([pkgName, pkgSkills]) => (
              <div key={pkgName} {...stylex.props(styles.pkgStack)}>
                <div {...stylex.props(styles.groupHeader)}>
                  <div {...stylex.props(styles.groupHeaderLeft)}>
                    <PackageIcon weight="light" style={{ width: 16, height: 16, flexShrink: 0 }} />
                    <span {...stylex.props(styles.truncate)}>{pkgName}</span>
                  </div>
                  <span {...stylex.props(styles.groupCount)}>{pkgSkills.length}</span>
                </div>

                <div {...stylex.props(styles.items)}>
                  {pkgSkills.map((skill) => {
                    const isSelected = selectedSkill?.id === skill.id;
                    return (
                      <button
                        key={skill.id}
                        onClick={() => onSelectSkill(skill)}
                        {...stylex.props(
                          styles.item,
                          isSelected ? styles.itemSelected : styles.itemDefault,
                        )}
                      >
                        <div {...stylex.props(styles.itemContent)}>
                          <div {...stylex.props(styles.itemTitleRow)}>
                            <span
                              {...stylex.props(
                                styles.itemTrigger,
                                isSelected ? styles.itemTriggerSelected : styles.itemTriggerDefault,
                              )}
                            >
                              {skill.metadata?.trigger || `/${skill.slug}`}
                            </span>
                            {skill.updateAvailable && (
                              <div {...stylex.props(styles.updateDot)} />
                            )}
                          </div>
                          <p
                            {...stylex.props(
                              styles.itemDesc,
                              isSelected ? styles.itemDescSelected : styles.itemDescDefault,
                            )}
                          >
                            {skill.metadata?.description || skill.name}
                          </p>
                        </div>
                        <CaretRightIcon
                          weight="bold"
                          {...stylex.props(
                            styles.caret,
                            isSelected ? styles.caretSelected : styles.caretDefault,
                          )}
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
