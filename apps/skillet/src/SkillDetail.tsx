import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Linking, Pressable, ScrollView, Switch, View } from "react-native";
import { Text } from "./AppText";
import { ErrorBanner } from "./ErrorBanner";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { useUniwind } from "uniwind";
import { useThemePalette } from "./services/theme";
import { createSkilletMarkdownStyle } from "./services/markdownStyle";
import { SkillCodeFence } from "./SkillCodeFence";
import { splitMarkdownFences, syntaxThemeForAppearance, type MarkdownSpan } from "./services/codeFence";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { InstallSkillDialog, UninstallSkillDialog } from "./dialogs";
import { isSkillEnabled, type Skill } from "./services/skills";
import type { Workspace } from "./services/workspaces";

const CONTINUOUS_STYLE = { borderCurve: "continuous" } as const;
const FENCE_BLOCK_STYLE = { borderRadius: 8 } as const;
const DETAIL_FADE_EASE = Easing.bezier(0.23, 1, 0.32, 1);

// Remount-driven fade (App keys SkillDetail by skill id): replaces the
// jump-cut between skills with a short cross-fade. Opacity-only, so it stays
// correct under reduced motion (apple §14).
function FadeOnMount({ children }: { children: React.ReactNode }): React.JSX.Element {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 160,
      easing: DETAIL_FADE_EASE,
      useNativeDriver: false,
    }).start();
  }, [opacity]);
  return <Animated.View style={{ flex: 1, opacity }}>{children}</Animated.View>;
}

const ProseSpan = React.memo(function ProseSpan({
  markdown,
  markdownStyle,
}: {
  markdown: string;
  markdownStyle: ReturnType<typeof createSkilletMarkdownStyle>;
}): React.JSX.Element {
  return (
    <EnrichedMarkdownText
      flavor="github"
      markdown={markdown}
      markdownStyle={markdownStyle}
      selectable
    />
  );
});

export function toggleReducer(prev: Set<string>, t: { workspaceId: string; enable: boolean }): Set<string> {
  const next = new Set(prev);
  if (t.enable) next.add(t.workspaceId);
  else next.delete(t.workspaceId);
  return next;
}

function MetaRow({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}): React.JSX.Element {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">{label}</Text>
      <Text
        className={`pt-0.5 text-[13px] ${muted ? "text-muted" : "font-medium text-foreground"}`}
        mono={mono}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function SkillDetailHeader({
  skill,
  action,
  onUpdate,
  onOpenInstall,
  onOpenUninstall,
  c,
}: {
  skill: Skill;
  action: "idle" | "updating" | "installing" | "uninstalling";
  onUpdate?: () => void;
  onOpenInstall?: () => void;
  onOpenUninstall?: () => void;
  c: ReturnType<typeof useThemePalette>;
}): React.JSX.Element {
  return (
    <View className="border-b border-border bg-surface px-6 pb-4 pt-4">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[22px] font-bold tracking-tight text-foreground">{skill.name}</Text>
            <View className="rounded-md border border-border bg-surface-muted px-2 py-0.5" style={CONTINUOUS_STYLE}>
              <Text className="text-[11px] font-semibold capitalize text-muted">
                {skill.scope === "global" ? "Global" : "Project"}
              </Text>
            </View>
            {skill.metadata.trigger ? (
              <View className="rounded-md bg-primary px-2 py-0.5" style={CONTINUOUS_STYLE}>
                <Text className="text-[11px] font-semibold text-white" mono>{skill.metadata.trigger}</Text>
              </View>
            ) : null}
            {skill.isSymlink ? (
              <View className="rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5" style={CONTINUOUS_STYLE}>
                <Text className="text-[11px] font-semibold text-primary">Symlinked</Text>
              </View>
            ) : null}
          </View>
          <Text className="pt-1.5 text-[13px] leading-5 text-muted">
            {skill.metadata.description === "" ? "No description provided." : skill.metadata.description}
          </Text>
        </View>
      </View>
      <View className="flex-row gap-2 pt-3">
        {onUpdate ? (
          <Pressable
            accessibilityRole="button"
            className="h-8 flex-row items-center gap-1.5 rounded-lg bg-primary px-3 active:opacity-85"
            disabled={action !== "idle"}
            onPress={onUpdate}
            style={CONTINUOUS_STYLE}
          >
            <SFSymbol color="#ffffff" name="arrow.clockwise" size={16} />
            <Text className="text-[12px] font-semibold text-white">
              {action === "updating" ? "Updating…" : "Update"}
            </Text>
          </Pressable>
        ) : null}
        {onOpenInstall ? (
          <Pressable
            accessibilityRole="button"
            className="h-8 flex-row items-center gap-1.5 rounded-lg border border-border bg-surface px-3 active:bg-surface-muted"
            disabled={action !== "idle"}
            onPress={onOpenInstall}
            style={CONTINUOUS_STYLE}
          >
            <SFSymbol color={c.primary} name="square.and.arrow.down" size={16} />
            <Text className="text-[12px] font-semibold text-primary">
              {action === "installing" ? "Installing…" : "Install"}
            </Text>
          </Pressable>
        ) : null}
        {onOpenUninstall ? (
          <Pressable
            accessibilityRole="button"
            className="h-8 flex-row items-center gap-1.5 rounded-lg border border-danger/30 bg-danger/10 px-3 active:bg-danger/20"
            disabled={action !== "idle"}
            onPress={onOpenUninstall}
            style={CONTINUOUS_STYLE}
          >
            <SFSymbol color={c.danger} name="trash" size={16} />
            <Text className="text-[12px] font-semibold text-danger">
              {action === "uninstalling" ? "Removing…" : "Uninstall"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function SkillMetadataCard({
  skill,
  c,
}: {
  skill: Skill;
  c: ReturnType<typeof useThemePalette>;
}): React.JSX.Element {
  const sourceUrl = skill.sourceUrl;
  return (
    <View
      className="gap-3 rounded-lg border border-border bg-surface p-5"
      style={CONTINUOUS_STYLE}
    >
      <View className="flex-row gap-4">
        <View className="min-w-0 flex-1">
          <MetaRow label="Source package" mono value={skill.packageName} />
        </View>
        <View className="flex-1">
          <MetaRow label="Agent target" value={skill.agent} />
        </View>
        <View className="flex-1">
          <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">Provider</Text>
          <View
            className="mt-1 self-start rounded-md border border-primary/30 bg-primary/15 px-2 py-0.5"
            style={CONTINUOUS_STYLE}
          >
            <Text className="text-[11px] font-semibold capitalize text-primary">
              {skill.provider ?? "local"}
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row gap-4">
        <View className="min-w-0 flex-1">
          <MetaRow
            label="Tools used"
            mono
            value={skill.metadata.tools && skill.metadata.tools.length > 0
              ? skill.metadata.tools.join(", ")
              : "None"}
          />
        </View>
        <View className="min-w-0 flex-[2]">
          {sourceUrl ? (
            <View>
              <Text className="text-[10px] font-bold uppercase tracking-wider text-muted">Source Repository / URL</Text>
              <Pressable
                accessibilityRole="link"
                className="flex-row items-center gap-1 pt-0.5 active:opacity-75"
                onPress={() => void Linking.openURL(sourceUrl).catch(() => {})}
              >
                <Text className="min-w-0 flex-1 text-[12px] font-medium text-primary" mono numberOfLines={1}>
                  {sourceUrl}
                </Text>
                <SFSymbol color={c.primary} name="arrow.up.right.square" size={12} />
              </Pressable>
            </View>
          ) : (
            <MetaRow label="Source Repository / URL" mono muted value="Local Directory" />
          )}
        </View>
      </View>
      <View className="border-t border-border pt-3">
        <MetaRow label="Path on disk" mono muted value={skill.path} />
      </View>
    </View>
  );
}

function SkillWorkspaceActivations({
  skill,
  workspaces,
  optimistic,
  onToggle,
}: {
  skill: Skill;
  workspaces: Workspace[];
  optimistic: Set<string>;
  onToggle: (ws: Workspace, enable: boolean) => void;
}): React.JSX.Element {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-1.5">
          <View className="h-4 w-1 rounded-full bg-primary" />
          <Text className="text-[12px] font-bold uppercase tracking-wider text-foreground">
            Per-repository activation
          </Text>
        </View>
        <Text className="text-[11px] text-muted">Symlinks managed automatically</Text>
      </View>
      <View
        className="rounded-lg border border-border bg-surface"
        style={CONTINUOUS_STYLE}
      >
        {workspaces.map((ws, idx) => {
          const isGlobal = ws.id === "global";
          const isLast = idx === workspaces.length - 1;
          return (
            <View
              className={`flex-row items-center justify-between px-4 py-3 ${isLast ? "" : "border-b border-border/60"}`}
              key={ws.id}
            >
              <View className="min-w-0 flex-1 flex-row items-center gap-2.5 pr-3">
                <View
                  className="h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-primary/15"
                  style={CONTINUOUS_STYLE}
                >
                  <Text className="text-[14px] font-bold text-primary">
                    {(ws.name.trim().charAt(0) || "•").toUpperCase()}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
                      {ws.name}
                    </Text>
                    {isGlobal ? (
                      <View className="rounded bg-surface-muted px-1.5 py-0" style={CONTINUOUS_STYLE}>
                        <Text className="text-[10px] font-bold uppercase text-muted" mono>All repos</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text className="pt-0.5 text-[11px] text-muted" mono numberOfLines={1}>
                    {ws.path}
                  </Text>
                </View>
              </View>
              {isGlobal ? (
                <View className="rounded-md border border-border bg-surface-muted px-2 py-0.5" style={CONTINUOUS_STYLE}>
                  <Text className="text-[11px] font-semibold text-muted">Active</Text>
                </View>
              ) : (
                <Switch
                  accessibilityLabel={`Enable ${skill.name} in ${ws.name}`}
                  onValueChange={(enable) => onToggle(ws, enable)}
                  value={optimistic.has(ws.id)}
                />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function SkillDocumentationSection({
  spans,
  markdownStyle,
  fenceBlockStyle,
  fenceTextStyle,
  fenceThemeName,
}: {
  spans: MarkdownSpan[];
  markdownStyle: object;
  fenceBlockStyle: object;
  fenceTextStyle: object;
  fenceThemeName: string;
}): React.JSX.Element {
  const keyedSpans = useMemo(
    () =>
      spans.map((span, idx) => ({
        key:
          span.type === "prose"
            ? `prose-${idx}-${span.text.length}`
            : `fence-${idx}-${span.lang}-${span.code.length}`,
        span,
      })),
    [spans],
  );

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-4 w-1 rounded-full bg-primary" />
          <Text className="text-[12px] font-bold uppercase tracking-wider text-foreground">
            SKILL.MD documentation
          </Text>
        </View>
        <Text className="text-[11px] text-muted" mono>Live Preview</Text>
      </View>
      <View
        className="rounded-lg border border-border bg-surface p-5"
        style={CONTINUOUS_STYLE}
      >
        {keyedSpans.map(({ key, span }) =>
          span.type === "prose" ? (
            <ProseSpan
              key={key}
              markdown={span.text}
              markdownStyle={markdownStyle}
            />
          ) : (
            <SkillCodeFence
              blockStyle={fenceBlockStyle}
              code={span.code}
              key={key}
              lang={span.lang}
              textStyle={fenceTextStyle}
              themeName={fenceThemeName}
            />
          ),
        )}
      </View>
    </View>
  );
}

export function SkillDetail({
  skill,
  workspaces,
  onToggleInRepo,
  onInstallSkill,
  onUninstallSkill,
  onUpdateSkill,
}: {
  skill: Skill | null;
  workspaces: Workspace[];
  onToggleInRepo: (workspace: Workspace, enable: boolean) => Promise<boolean>;
  onInstallSkill?: (source: string, skillName?: string) => Promise<void>;
  onUninstallSkill?: (skill: Skill) => Promise<void>;
  onUpdateSkill?: (skill: Skill) => Promise<void>;
}): React.JSX.Element {
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<"idle" | "updating" | "installing" | "uninstalling">("idle");
  const [actionError, setActionError] = useState<string | null>(null);
  const [installOpen, setInstallOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const { theme } = useUniwind();
  const appearance = theme === "dark" ? "dark" : "light";
  const c = useThemePalette();
  const markdownStyle = useMemo(() => createSkilletMarkdownStyle(appearance), [appearance]);
  const fenceThemeName = syntaxThemeForAppearance(appearance);

  const rawMarkdown = skill?.rawMarkdown ?? "";
  const spans = useMemo(
    () => splitMarkdownFences(rawMarkdown === "" ? "# No body content in SKILL.md" : rawMarkdown),
    [rawMarkdown],
  );

  const fenceTextStyle = useMemo(() => ({
    fontFamily: markdownStyle.codeBlock?.fontFamily,
    fontSize: markdownStyle.codeBlock?.fontSize,
    lineHeight: markdownStyle.codeBlock?.lineHeight,
  } as const), [markdownStyle]);

  useEffect(() => {
    setOptimistic(new Set());
    if (!skill) return;
    let cancelled = false;
    void (async () => {
      const errors: string[] = [];
      const entries = await Promise.all(
        workspaces
          .filter((ws) => ws.id !== "global")
          .map(async (ws): Promise<[string, boolean]> => {
            try {
              return [ws.id, await isSkillEnabled(skill.slug, ws.path)];
            } catch (err: unknown) {
              errors.push(`${ws.name}: ${err instanceof Error ? err.message : "unknown error"}`);
              return [ws.id, false];
            }
          }),
      );
      if (!cancelled) {
        setOptimistic(new Set(entries.filter(([, ok]) => ok).map(([id]) => id)));
        if (errors.length > 0) {
          setActionError(`Could not check skill status in: ${errors.join("; ")}`);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skill, workspaces]);

  const handleToggle = useCallback(
    (ws: Workspace, enable: boolean): void => {
      setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable }));
      setActionError(null);
      void Promise.resolve()
        .then(() => onToggleInRepo(ws, enable))
        .then((ok) => {
          if (!ok) {
            setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable: !enable }));
            setActionError(
              `Could not ${enable ? "enable" : "disable"} skill "${skill?.name ?? ""}" in workspace "${ws.name}".`,
            );
          }
        })
        .catch((err: unknown) => {
          setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable: !enable }));
          setActionError(
            err instanceof Error ? err.message : `Could not ${enable ? "enable" : "disable"} skill.`,
          );
        });
    },
    [onToggleInRepo, skill?.name],
  );

  const runAction = useCallback(
    async (
      kind: typeof action,
      fn: (s: Skill) => Promise<void>,
      close?: () => void,
    ): Promise<void> => {
      if (!skill) return;
      setAction(kind);
      setActionError(null);
      try {
        await fn(skill);
        close?.();
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        setActionError(message);
        throw cause;
      } finally {
        setAction("idle");
      }
    },
    [skill],
  );

  const handleUpdate = useMemo(() => {
    if (!skill?.updateAvailable || !onUpdateSkill) return undefined;
    return () => {
      void runAction("updating", onUpdateSkill).catch(() => {});
    };
  }, [skill, onUpdateSkill, runAction]);

  if (!skill) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-[13px] text-muted">
          Select a skill from the left column to view its details.
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" key={skill.id}>
      <FadeOnMount>
      <SkillDetailHeader
        action={action}
        c={c}
        onOpenInstall={onInstallSkill ? () => setInstallOpen(true) : undefined}
        onOpenUninstall={onUninstallSkill ? () => setUninstallOpen(true) : undefined}
        onUpdate={handleUpdate}
        skill={skill}
      />
      <ErrorBanner
        className="mx-6 mt-3"
        error={actionError}
        onDismiss={() => setActionError(null)}
      />

      <ScrollView className="flex-1">
        <View className="mx-auto w-full max-w-[896px] gap-5 px-6 py-5">
          <SkillMetadataCard c={c} skill={skill} />

          <SkillWorkspaceActivations
            onToggle={handleToggle}
            optimistic={optimistic}
            skill={skill}
            workspaces={workspaces}
          />

          <SkillDocumentationSection
            fenceBlockStyle={FENCE_BLOCK_STYLE}
            fenceTextStyle={fenceTextStyle}
            fenceThemeName={fenceThemeName}
            markdownStyle={markdownStyle}
            spans={spans}
          />
        </View>
      </ScrollView>

      {installOpen && onInstallSkill ? (
        <InstallSkillDialog
          error={installError}
          installing={action === "installing"}
          onClose={() => {
            setInstallOpen(false);
            setInstallError(null);
          }}
          onInstall={(source, skillName) =>
            runAction("installing", () => onInstallSkill(source, skillName), () => {
              setInstallOpen(false);
              setInstallError(null);
            }).catch((cause: unknown) => {
              setInstallError(cause instanceof Error ? cause.message : "Install failed.");
            })}
        />
      ) : null}
      {uninstallOpen && onUninstallSkill ? (
        <UninstallSkillDialog
          onClose={() => setUninstallOpen(false)}
          onConfirm={() =>
            void runAction("uninstalling", onUninstallSkill, () => setUninstallOpen(false)).catch(
              () => {},
            )}
          skillName={skill.name}
          uninstalling={action === "uninstalling"}
        />
      ) : null}
      </FadeOnMount>
    </View>
  );
}
