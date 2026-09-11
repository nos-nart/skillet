import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { useUniwind } from "uniwind";
import { createSkilletMarkdownStyle } from "./services/markdownStyle";
import { SkillCodeFence } from "./SkillCodeFence";
import { splitMarkdownFences, syntaxThemeForAppearance } from "./services/codeFence";
import { EnrichedMarkdownText } from "react-native-enriched-markdown";
import { InstallSkillDialog, UninstallSkillDialog } from "./dialogs";
import { isSkillEnabled, type Skill } from "./services/skills";
import { getWorkspaces, type Workspace } from "./services/workspaces";

// Optimistic toggle helper: the component seeds a `Set` of workspace ids
// where the skill is enabled and applies this reducer per `Switch` flip,
// rolling back when the native call reports failure. Pure so it stays
// unit-testable without the RN runtime.
export function toggleReducer(prev: Set<string>, t: { workspaceId: string; enable: boolean }): Set<string> {
  const next = new Set(prev);
  if (t.enable) next.add(t.workspaceId);
  else next.delete(t.workspaceId);
  return next;
}

// Native port of the web `SkillDetail` (`src/components/SkillDetail.tsx`):
// meta grid → Uniwind rows, per-workspace `Switch` switchboard with optimistic
// toggles, `ConfirmDialog` → native-modal dialogs, comark+shiki
// `MarkdownViewer` → `<EnrichedMarkdownText flavor="github" selectable>`
// (spec §2; expect Shiki-theme visual diff).
//
// NOTE on the brief snippet: it renders `value={body}`, but the installed
// `react-native-enriched-markdown@0.7.4` takes `markdown` (`value` does not
// exist and would render nothing) — `markdown={body}` is the correct prop.
export function SkillDetail({
  skill,
  onToggleInRepo,
  onInstallSkill,
  onUninstallSkill,
  onUpdateSkill,
}: {
  skill: Skill | null;
  // Resolves true when the toggle was applied; false (or throw) rolls the
  // optimistic flip back. `workspacePath` is the stored absolute path —
  // `symlink`/`unlink` do NOT expand `~` (Task 3), and the workspace picker
  // only ever stores absolute file-dialog paths.
  onToggleInRepo: (workspace: Workspace, enable: boolean) => Promise<boolean>;
  // Installs an arbitrary source collected by the InstallSkillDialog (not the
  // selected skill — Task 7 fix: Task 6 discarded the dialog inputs and
  // re-passed the selection, making the source field dead).
  onInstallSkill?: (source: string, skillName?: string) => Promise<void>;
  onUninstallSkill?: (skill: Skill) => Promise<void>;
  onUpdateSkill?: (skill: Skill) => Promise<void>;
}): React.JSX.Element {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [optimistic, setOptimistic] = useState<Set<string>>(new Set());
  const [action, setAction] = useState<"idle" | "updating" | "installing" | "uninstalling">("idle");
  const [installOpen, setInstallOpen] = useState(false);
  const [uninstallOpen, setUninstallOpen] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const { theme } = useUniwind();
  const appearance = theme === "dark" ? "dark" : "light";
  const markdownStyle = useMemo(() => createSkilletMarkdownStyle(appearance), [appearance]);
  const fenceThemeName = syntaxThemeForAppearance(appearance);
  // codeBlock is optional in MarkdownStyle: per-field ?. keeps undefined as
  // the RN default instead of asserting a shape the type does not promise.
  const fenceBlockStyle = {
    backgroundColor: markdownStyle.codeBlock?.backgroundColor,
    borderColor: markdownStyle.codeBlock?.borderColor,
    borderRadius: markdownStyle.codeBlock?.borderRadius,
    borderWidth: markdownStyle.codeBlock?.borderWidth,
    padding: markdownStyle.codeBlock?.padding,
  } as const;
  const fenceTextStyle = {
    color: markdownStyle.codeBlock?.color,
    fontFamily: markdownStyle.codeBlock?.fontFamily,
    fontSize: markdownStyle.codeBlock?.fontSize,
    lineHeight: markdownStyle.codeBlock?.lineHeight,
  } as const;

  useEffect(() => {
    let cancelled = false;
    void getWorkspaces().then((list) => {
      if (!cancelled) setWorkspaces(list);
    }, () => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-seed optimistic state whenever the selection changes: enabled set =
  // workspaces where the native `isSkillEnabled` probe finds the slug.
  useEffect(() => {
    setOptimistic(new Set());
    if (!skill) return;
    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        workspaces
          .filter((ws) => ws.id !== "global")
          .map(async (ws): Promise<[string, boolean]> => {
            try {
              return [ws.id, await isSkillEnabled(skill.slug, ws.path)];
            } catch {
              return [ws.id, false];
            }
          }),
      );
      if (!cancelled) {
        setOptimistic(new Set(entries.filter(([, on]) => on).map(([id]) => id)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [skill, workspaces]);

  if (!skill) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-10">
        <Text className="text-center text-[16px] font-bold text-foreground">No skill selected</Text>
        <Text className="pt-1.5 text-center text-[12px] text-muted">
          Select a skill from the list to view instructions, tools, and manage workspace activation.
        </Text>
      </View>
    );
  }

  const handleToggle = (ws: Workspace, enable: boolean): void => {
    setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable }));
    void Promise.resolve()
      .then(() => onToggleInRepo(ws, enable))
      .then((ok) => {
        if (!ok) {
          setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable: !enable }));
        }
      })
      .catch(() => {
        setOptimistic((prev) => toggleReducer(prev, { workspaceId: ws.id, enable: !enable }));
      });
  };

  const runAction = (
    kind: typeof action,
    fn: (s: Skill) => Promise<void>,
    close?: () => void,
  ): Promise<void> => {
    setAction(kind);
    return fn(skill).then(
      () => {
        setAction("idle");
        close?.();
      },
      (cause: unknown) => {
        setAction("idle");
        throw cause;
      },
    );
  };

  // Hoisted so the source-URL row's `onPress` closure keeps the narrowing
  // without a cast (`skill.sourceUrl` alone would widen inside the closure).
  const sourceUrl = skill.sourceUrl;

  return (
    <View className="flex-1 bg-background" key={skill.id}>
      <View className="border-b border-border px-5 pb-4 pt-5">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-[22px] font-bold text-foreground">{skill.name}</Text>
          <View className="rounded-md bg-surface-muted px-2 py-0.5">
            <Text className="text-[11px] font-semibold capitalize text-muted">
              {skill.scope === "global" ? "Global" : "Project"}
            </Text>
          </View>
          {skill.metadata.trigger ? (
            <View className="rounded-md bg-primary px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-white">{skill.metadata.trigger}</Text>
            </View>
          ) : null}
          {skill.isSymlink ? (
            <View className="rounded-md bg-surface-muted px-2 py-0.5">
              <Text className="text-[11px] font-semibold text-muted">Symlinked</Text>
            </View>
          ) : null}
        </View>
        <Text className="pt-1.5 text-[13px] text-muted">
          {skill.metadata.description === "" ? "No description provided." : skill.metadata.description}
        </Text>
        <View className="flex-row gap-2 pt-3">
          {skill.updateAvailable && onUpdateSkill ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-md bg-primary px-3 py-1.5"
              disabled={action !== "idle"}
              onPress={() =>
                runAction("updating", onUpdateSkill).catch((cause: unknown) => {
                  console.error("Update failed:", cause);
                })}
            >
              <Text className="text-[12px] font-semibold text-white">
                {action === "updating" ? "Updating…" : "Update"}
              </Text>
            </Pressable>
          ) : null}
          {onInstallSkill ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-md border border-border px-3 py-1.5"
              disabled={action !== "idle"}
              onPress={() => setInstallOpen(true)}
            >
              <Text className="text-[12px] font-semibold text-primary">
                {action === "installing" ? "Installing…" : "Install"}
              </Text>
            </Pressable>
          ) : null}
          {onUninstallSkill ? (
            <Pressable
              accessibilityRole="button"
              className="rounded-md bg-danger px-3 py-1.5"
              disabled={action !== "idle"}
              onPress={() => setUninstallOpen(true)}
            >
              <Text className="text-[12px] font-semibold text-white">
                {action === "uninstalling" ? "Removing…" : "Uninstall"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="gap-5 px-5 py-4">
          <View className="gap-2 rounded-lg border border-border bg-surface-muted p-4">
            <MetaRow label="Source package" mono value={skill.packageName} />
            <MetaRow label="Agent target" value={skill.agent} />
            <MetaRow label="Provider" value={skill.provider ?? "local"} />
            <MetaRow
              label="Tools used"
              mono
              value={skill.metadata.tools && skill.metadata.tools.length > 0
                ? skill.metadata.tools.join(", ")
                : "None"}
            />
            <MetaRow label="Path on disk" mono muted value={skill.path} />
            {sourceUrl ? (
              <View>
                <Text className="text-[10px] font-bold uppercase text-muted">Source URL</Text>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(sourceUrl)}
                >
                  <Text className="pt-0.5 text-[12px] text-primary" numberOfLines={2}>
                    {`${sourceUrl} ↗`}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          <View className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-[12px] font-bold uppercase text-foreground">
                Per-repository activation
              </Text>
              <Text className="text-[12px] text-muted">Symlinks managed automatically</Text>
            </View>
            <View className="overflow-hidden rounded-lg border border-border bg-surface-muted">
              {workspaces.map((ws) => {
                const isGlobal = ws.id === "global";
                return (
                  <View
                    className="flex-row items-center justify-between px-4 py-3"
                    key={ws.id}
                  >
                    <View className="flex-1 pr-3">
                      <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
                        {ws.name}
                      </Text>
                      <Text className="pt-0.5 text-[11px] text-muted" numberOfLines={1}>
                        {ws.path}
                      </Text>
                    </View>
                    {isGlobal ? (
                      <View className="rounded-md bg-surface px-2 py-0.5">
                        <Text className="text-[11px] font-semibold text-muted">Active</Text>
                      </View>
                    ) : (
                      <Switch
                        accessibilityLabel={`Enable ${skill.name} in ${ws.name}`}
                        onValueChange={(enable) => handleToggle(ws, enable)}
                        value={optimistic.has(ws.id)}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-[12px] font-bold uppercase text-foreground">
              SKILL.MD documentation
            </Text>
            <View className="rounded-lg border border-border bg-surface-muted p-4">
              {splitMarkdownFences(skill.rawMarkdown === "" ? "# No body content in SKILL.md" : skill.rawMarkdown).map(
                (span, index) =>
                  span.type === "prose" ? (
                    <EnrichedMarkdownText
                      flavor="github"
                      key={index}
                      markdown={span.text}
                      markdownStyle={markdownStyle}
                      selectable
                    />
                  ) : (
                    <SkillCodeFence
                      blockStyle={fenceBlockStyle}
                      code={span.code}
                      key={index}
                      lang={span.lang}
                      textStyle={fenceTextStyle}
                      themeName={fenceThemeName}
                    />
                  ),
              )}
            </View>
          </View>
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
            runAction("uninstalling", onUninstallSkill, () => setUninstallOpen(false)).catch(
              (cause: unknown) => {
                console.error("Uninstall failed:", cause);
              },
            )}
          skillName={skill.name}
          uninstalling={action === "uninstalling"}
        />
      ) : null}
    </View>
  );
}

function MetaRow({
  label,
  value,
  mono = false,
  muted = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
}): React.JSX.Element {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase text-muted">{label}</Text>
      <Text
        className={muted ? "pt-0.5 text-[12px] text-muted" : "pt-0.5 text-[12px] text-foreground"}
        numberOfLines={2}
        style={mono ? { fontFamily: "monospace" } : undefined}
      >
        {value}
      </Text>
    </View>
  );
}
