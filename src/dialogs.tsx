import { useCallback, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type TextStyle,
} from "react-native";
import { SFSymbol } from "@legendapp/spark/ui/symbol";
import { Text } from "./AppText";
import { pickDirectory } from "./services/pickDirectory";
import { WORKSPACE_SKILLS_REL, type DownloadSkillInput } from "./services/skills";
import {
  searchSkillsSh,
  skillsShUrl,
  SKILLS_SH_MIN_QUERY,
  type SkillsShItem,
} from "./services/skillsSh";
import { useThemePalette } from "./services/theme";
import type { Workspace } from "./services/workspaces";

const CONTINUOUS_CURVE = { borderCurve: "continuous" } as const;
const INPUT_STYLE = { borderCurve: "continuous", fontFamily: "Space Grotesk" } as const;
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };

const MATERIAL_EASE = Easing.bezier(0.23, 1, 0.32, 1);
const EXIT_MS = 140;

function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    try {
      const query = AccessibilityInfo.isReduceMotionEnabled?.();
      if (query && typeof query.then === "function") {
        query.then((v) => {
          if (alive) setReduce(v);
        }).catch(() => {});
      }
    } catch {
      // Animate by default when the platform query is unavailable.
    }
    return () => {
      alive = false;
    };
  }, []);
  return reduce;
}

function DialogShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (requestClose: () => void) => React.ReactNode;
}): React.JSX.Element {
  const reduceMotion = useReduceMotion();
  const palette = useThemePalette();
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    if (reduceMotion) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 150,
        easing: MATERIAL_EASE,
        useNativeDriver: false,
      }).start();
      return;
    }
    Animated.spring(progress, {
      toValue: 1,
      stiffness: 380,
      damping: 30,
      mass: 0.9,
      useNativeDriver: false,
    }).start();
  }, [progress, reduceMotion]);

  const requestClose = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(progress, {
      toValue: 0,
      duration: EXIT_MS,
      easing: MATERIAL_EASE,
      useNativeDriver: false,
    }).start(() => onClose());
  }, [progress, onClose]);

  const scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] });
  const cardScale = reduceMotion
    ? 1
    : progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View className="absolute inset-0 z-50 items-center justify-center px-8">
      <Animated.View
        style={[StyleSheet.absoluteFillObject, { backgroundColor: "#000000", opacity: scrimOpacity }]}
      />
      <Pressable
        accessibilityLabel="Close dialog"
        accessibilityRole="button"
        className="absolute inset-0"
        onPress={requestClose}
      />
      <Animated.View
        style={[
          {
            opacity: progress,
            transform: [{ scale: cardScale }],
            width: "100%",
            maxWidth: 440,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: palette.border,
            backgroundColor: palette.surface,
            padding: 24,
            shadowColor: "#000000",
            shadowOpacity: 0.32,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 12 },
          },
          CONTINUOUS_CURVE,
        ]}
      >
        {children(requestClose)}
      </Animated.View>
    </View>
  );
}

export type InstallScope =
  | { kind: "global" }
  | { kind: "workspace"; path: string; name: string }
  | { kind: "folder"; path: string };

function scopeLabel(scope: InstallScope): string {
  switch (scope.kind) {
    case "global":
      return "Global (~/.skills)";
    case "workspace":
      return scope.name;
    case "folder":
      return scope.path;
  }
}

export function targetDirFor(scope: InstallScope, slug: string): string | undefined {
  if (scope.kind === "global") return undefined;
  if (scope.kind === "workspace") return `${scope.path}/${WORKSPACE_SKILLS_REL}/${slug}`;
  return `${scope.path}/${slug}`;
}

function inferManualSlug(source: string, explicitName: string): string {
  const trimmedName = explicitName.trim();
  if (trimmedName !== "") return trimmedName;
  const parts = source.trim().replace(/\/+$/, "").split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "skill";
}

function formatInstalls(installs: number): string {
  if (installs >= 1000) {
    const k = installs / 1000;
    return `${k >= 100 ? String(Math.round(k)) : k.toFixed(1)}K installs`;
  }
  return `${installs} install${installs === 1 ? "" : "s"}`;
}

function ScopeDropdown({
  scope,
  scopeOpen,
  workspaces,
  onToggle,
  onSelect,
  onBrowse,
}: {
  scope: InstallScope;
  scopeOpen: boolean;
  workspaces: Workspace[];
  onToggle: () => void;
  onSelect: (scope: InstallScope) => void;
  onBrowse: () => void;
}): React.JSX.Element {
  const c = useThemePalette();
  return (
    <View className="overflow-hidden rounded-[10px] border border-border bg-surface-muted" style={CONTINUOUS_CURVE}>
      <Pressable
        accessibilityRole="button"
        className="flex-row items-center gap-2 px-3 py-2 active:opacity-75"
        onPress={onToggle}
      >
        <SFSymbol color={c.primary} name="arrow.triangle.branch" size={14} />
        <Text className="min-w-0 flex-1 text-[12px] font-medium text-foreground" numberOfLines={1}>
          {scopeLabel(scope)}
        </Text>
        <SFSymbol color={c.muted} name="chevron.down" size={11} />
      </Pressable>
      {scopeOpen ? (
        <>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-2 border-t border-border/80 px-3 py-2 active:opacity-75"
            onPress={() => onSelect({ kind: "global" })}
          >
            <Text className="min-w-0 flex-1 text-[12px] text-foreground" numberOfLines={1}>
              Global (~/.skills)
            </Text>
            {scope.kind === "global" ? <SFSymbol color={c.primary} name="checkmark" size={13} /> : null}
          </Pressable>
          {workspaces.map((ws) => {
            const selected = scope.kind === "workspace" && scope.path === ws.path;
            return (
              <Pressable
                key={ws.id}
                accessibilityRole="button"
                className="flex-row items-center gap-2 border-t border-border/80 px-3 py-2 active:opacity-75"
                onPress={() => onSelect({ kind: "workspace", path: ws.path, name: ws.name })}
              >
                <Text className="min-w-0 flex-1 text-[12px] text-foreground" numberOfLines={1}>
                  {ws.name}
                </Text>
                {selected ? <SFSymbol color={c.primary} name="checkmark" size={13} /> : null}
              </Pressable>
            );
          })}
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-2 border-t border-border/80 px-3 py-2 active:opacity-75"
            onPress={onBrowse}
          >
            <Text className="min-w-0 flex-1 text-[12px] text-foreground" numberOfLines={1}>
              Browse folder…
            </Text>
            {scope.kind === "folder" ? <SFSymbol color={c.primary} name="checkmark" size={13} /> : null}
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

export function InstallSkillDialog({
  initialSource = "",
  installing = false,
  error: externalError,
  workspaces = [],
  installedSlugs = [],
  onClose,
  onInstall,
}: {
  initialSource?: string;
  installing?: boolean;
  error?: string | null;
  workspaces?: Workspace[];
  installedSlugs?: string[];
  onClose: () => void;
  onInstall: (input: DownloadSkillInput) => Promise<void>;
}): React.JSX.Element {
  const [source, setSource] = useState(initialSource);
  const [skillName, setSkillName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [manualOpen, setManualOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SkillsShItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [scope, setScope] = useState<InstallScope>({ kind: "global" });
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [justInstalledSlugs, setJustInstalledSlugs] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [scopeOpen, setScopeOpen] = useState(false);
  const error = externalError ?? localError;

  useEffect(() => {
    setScope((prev) => {
      if (prev.kind === "workspace" && !workspaces.some((ws) => ws.path === prev.path)) {
        return { kind: "global" };
      }
      return prev;
    });
  }, [workspaces]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < SKILLS_SH_MIN_QUERY) {
      setResults([]);
      setSearchError(null);
      setSearching(false);
      return;
    }
    setSearching(true);
    let alive = true;
    const timer = setTimeout(() => {
      void searchSkillsSh(q).then((res) => {
        if (!alive) return;
        setSearching(false);
        if (res.ok) {
          setResults(res.items);
          setSearchError(null);
        } else {
          setResults([]);
          setSearchError(res.error);
        }
      });
    }, 300);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [query]);

  const handleSubmit = async (requestClose: () => void): Promise<void> => {
    const trimmed = source.trim();
    if (trimmed === "" || installing) return;
    const explicitSkillName = skillName.trim() === "" ? undefined : skillName.trim();
    const targetSlug = inferManualSlug(trimmed, skillName);
    try {
      await onInstall({
        source: trimmed,
        skillName: explicitSkillName,
        targetDir: targetDirFor(scope, targetSlug),
      });
      requestClose();
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Install failed");
    }
  };

  const handleInstallItem = (item: SkillsShItem): void => {
    if (busySlug !== null) return;
    const slug = item.skillId;
    setBusySlug(slug);
    setStatus(`Installing ${slug} to ${scopeLabel(scope)}…`);
    setLocalError(null);
    void onInstall({
      source: skillsShUrl(item),
      skillName: slug,
      targetDir: targetDirFor(scope, slug),
    })
      .then(
        () => {
          setJustInstalledSlugs((prev) => (prev.includes(slug) ? prev : [...prev, slug]));
          setStatus(`Installed ${slug}.`);
        },
        (cause: unknown) => {
          setLocalError(cause instanceof Error ? cause.message : "Install failed.");
          setStatus(null);
        },
      )
      .finally(() => setBusySlug(null));
  };

  const handleBrowse = (): void => {
    void pickDirectory("Install skill here").then((path) => {
      if (path) setScope({ kind: "folder", path });
    });
  };

  const disabled = installing || source.trim() === "";
  const showEmpty =
    !searching &&
    searchError === null &&
    results.length === 0 &&
    query.trim().length >= SKILLS_SH_MIN_QUERY;

  return (
    <DialogShell onClose={onClose}>
      {(requestClose) => (
        <>
          <Text className="text-[18px] font-bold tracking-tight text-foreground">Install Skill</Text>
          <Text className="pb-3 pt-1 text-[13px] leading-5 text-muted">
            Search skills.sh, or install directly from a GitHub repository.
          </Text>
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="rounded-[10px] border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
            enableFocusRing={false}
            focusRingType="none"
            style={INPUT_STYLE}
            onChangeText={(t) => {
              setQuery(t);
              setStatus(null);
            }}
            placeholder="Search skills.sh… e.g. turborepo"
            value={query}
          />
          {searching ? (
            <Text className="pt-2 text-[12px] text-muted">Searching skills.sh…</Text>
          ) : null}
          {searchError ? (
            <Text className="pt-2 text-[12px] text-danger">{searchError}</Text>
          ) : null}
          {showEmpty ? (
            <Text className="pt-2 text-[12px] text-muted">
              {`No skills found for '${query.trim()}'.`}
            </Text>
          ) : null}
          {results.length > 0 ? (
            <ScrollView
              style={{ maxHeight: 212 }}
              className="mt-2.5 overflow-hidden rounded-[10px] border border-border bg-surface-muted/40"
            >
              {results.map((item, idx) => {
                const installed =
                  installedSlugs.includes(item.skillId) || justInstalledSlugs.includes(item.skillId);
                const busy = busySlug === item.skillId;
                const rowDisabled = installed || busy || busySlug !== null;
                const isLast = idx === results.length - 1;
                return (
                  <View
                    key={item.id}
                    className={`flex-row items-center gap-2 px-3 py-2.5 ${
                      isLast ? "" : "border-b border-border/70"
                    }`}
                  >
                    <View className="min-w-0 flex-1">
                      <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text className="text-[11px] text-muted" numberOfLines={1} style={TABULAR_NUMS}>
                        {`${item.source} · ${formatInstalls(item.installs)}`}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: rowDisabled }}
                      className={
                        installed
                          ? "rounded-[8px] border border-border bg-surface px-2.5 py-1"
                          : "rounded-[8px] bg-primary px-2.5 py-1 active:opacity-80"
                      }
                      style={CONTINUOUS_CURVE}
                      disabled={rowDisabled}
                      onPress={() => handleInstallItem(item)}
                    >
                      <Text
                        className={
                          installed
                            ? "text-[12px] font-medium text-muted"
                            : "text-[12px] font-semibold text-white"
                        }
                      >
                        {busy ? "Installing…" : installed ? "Installed" : "Install"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          ) : null}
          <Text className="pb-1.5 pt-3.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Install Destination
          </Text>
          <ScopeDropdown
            scope={scope}
            scopeOpen={scopeOpen}
            workspaces={workspaces.filter((ws) => ws.id !== "global")}
            onToggle={() => setScopeOpen((v) => !v)}
            onSelect={(next) => {
              setScope(next);
              setScopeOpen(false);
            }}
            onBrowse={() => {
              setScopeOpen(false);
              handleBrowse();
            }}
          />
          {scope.kind === "folder" ? (
            <Text className="pt-1 text-[11px] text-muted" mono numberOfLines={1}>
              {scope.path}
            </Text>
          ) : null}
          {status ? (
            <Text className="pt-2 text-[12px] font-medium text-primary">{status}</Text>
          ) : null}
          <Pressable
            accessibilityRole="button"
            className="pt-3 active:opacity-75"
            onPress={() => setManualOpen((v) => !v)}
          >
            <Text className="text-[12px] font-medium text-primary">
              {manualOpen ? "Hide manual source entry" : "Install from GitHub URL or owner/repo instead"}
            </Text>
          </Pressable>
          {manualOpen ? (
            <>
              <Text className="pb-1 pt-2.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Source Repository or URL
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-[10px] border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
                enableFocusRing={false}
                focusRingType="none"
                style={INPUT_STYLE}
                onChangeText={(t) => {
                  setSource(t);
                  setLocalError(null);
                }}
                placeholder="anthropics/eli5"
                value={source}
              />
              <Text className="pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
                Skill Name (Optional)
              </Text>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="rounded-[10px] border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
                enableFocusRing={false}
                focusRingType="none"
                style={INPUT_STYLE}
                onChangeText={setSkillName}
                placeholder="my-skill"
                value={skillName}
              />
            </>
          ) : null}
          {error ? <Text className="pt-2 text-[12px] text-danger">{error}</Text> : null}
          <View className="flex-row justify-end gap-2 pt-5">
            <Pressable
              accessibilityRole="button"
              className="rounded-[9px] border border-border bg-surface-muted px-3.5 py-1.5 active:opacity-75"
              style={CONTINUOUS_CURVE}
              disabled={installing}
              onPress={requestClose}
            >
              <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
            </Pressable>
            {manualOpen ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled }}
                className={
                  disabled
                    ? "rounded-[9px] bg-surface-muted px-3.5 py-1.5 opacity-50"
                    : "rounded-[9px] bg-primary px-3.5 py-1.5 active:opacity-80"
                }
                style={CONTINUOUS_CURVE}
                disabled={disabled}
                onPress={() => void handleSubmit(requestClose)}
              >
                <Text
                  className={
                    disabled
                      ? "text-[13px] font-medium text-muted"
                      : "text-[13px] font-semibold text-white"
                  }
                >
                  {installing ? "Installing…" : "Install Skill"}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </DialogShell>
  );
}

export function UninstallSkillDialog({
  skillName,
  uninstalling = false,
  onClose,
  onConfirm,
}: {
  skillName: string;
  uninstalling?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <DialogShell onClose={onClose}>
      {(requestClose) => (
        <>
          <Text className="text-[17px] font-bold tracking-tight text-foreground">Uninstall Skill</Text>
          <Text className="pt-1.5 text-[13px] leading-5 text-muted">
            {`Are you sure you want to uninstall '${skillName}' from your system? This deletes the skill folder and unbinds any active workspace symlinks.`}
          </Text>
          <View className="flex-row justify-end gap-2 pt-5">
            <Pressable
              accessibilityRole="button"
              className="rounded-[9px] border border-border bg-surface-muted px-3.5 py-1.5 active:opacity-75"
              style={CONTINUOUS_CURVE}
              disabled={uninstalling}
              onPress={requestClose}
            >
              <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="rounded-[9px] bg-danger px-3.5 py-1.5 active:opacity-80"
              style={CONTINUOUS_CURVE}
              disabled={uninstalling}
              onPress={onConfirm}
            >
              <Text className="text-[13px] font-semibold text-white">
                {uninstalling ? "Removing…" : "Uninstall"}
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </DialogShell>
  );
}
