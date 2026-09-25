import { useCallback, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Pressable, TextInput, View } from "react-native";
import { Text } from "./AppText";
import { parseGitHubRepo } from "./services/github";

const CONTINUOUS_CURVE = { borderCurve: "continuous" } as const;
const INPUT_STYLE = { borderCurve: "continuous", fontFamily: "Space Grotesk" } as const;

// Strong ease-out for entrances (appllama motion law); exits mirror it.
const MATERIAL_EASE = Easing.bezier(0.23, 1, 0.32, 1);
const ENTER_MS = 200;
const EXIT_MS = 150;

// JS-driven opacity/scale: short and subtle enough to hold 60fps without
// depending on the native animation driver.
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

// Overlay dialogs matching the web UI (`src/components/NewSkillDialog.tsx`
// install mode + `src/components/ConfirmDialog.tsx` destructive variant).
// Uses absolute-positioned backdrop overlay (native React Native macOS Modal
// is unimplemented in Fabric and crashes with SIGSEGV).
function DialogShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: (requestClose: () => void) => React.ReactNode;
}): React.JSX.Element {
  // 0 = hidden, 1 = shown. Enter plays on mount; requesting close plays the
  // mirrored exit first and only then unmounts (symmetric paths, apple §7).
  const reduceMotion = useReduceMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: ENTER_MS,
      easing: MATERIAL_EASE,
      useNativeDriver: false,
    }).start();
  }, [progress]);

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

  const scrimOpacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] });
  // Reduced motion: cross-fade only, no scale (apple §14).
  const cardScale = reduceMotion
    ? 1
    : progress.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

  return (
    <View className="absolute inset-0 z-50 items-center justify-center px-8">
      <Animated.View className="absolute inset-0 bg-black" style={{ opacity: scrimOpacity }} />
      <Pressable
        accessibilityLabel="Close dialog"
        accessibilityRole="button"
        className="absolute inset-0"
        onPress={requestClose}
      />
      {/* NOTE: plain View, not a nested Pressable. Pressables nested inside a
          Pressable never receive taps on react-native-macos (the parent steals
          the responder/pointer), which deadened every dialog button. A View
          already blocks backdrop presses: hit-testing finds this subtree first
          and there is no bubbling to the backdrop sibling in native RN. */}
      <Animated.View
        className="w-full max-w-[420px] rounded-lg border border-border bg-background p-6 shadow-2xl"
        style={[{ opacity: progress, transform: [{ scale: cardScale }] }, CONTINUOUS_CURVE]}
      >
        {children(requestClose)}
      </Animated.View>
    </View>
  );
}

export function InstallSkillDialog({
  initialSource = "",
  installing = false,
  error: externalError,
  onClose,
  onInstall,
}: {
  initialSource?: string;
  installing?: boolean;
  error?: string | null;
  onClose: () => void;
  onInstall: (source: string, skillName?: string) => Promise<void>;
}): React.JSX.Element {
  const [source, setSource] = useState(initialSource);
  const [skillName, setSkillName] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const error = externalError ?? localError;

  const handleSubmit = async (): Promise<void> => {
    const trimmed = source.trim();
    if (trimmed === "" || installing) return;
    // Same acceptance as the web form + DiscoverTab: owner/repo shorthand,
    // github URLs, and skills.sh links.
    try {
      await onInstall(trimmed, skillName.trim() === "" ? undefined : skillName.trim());
    } catch (e: unknown) {
      setLocalError(e instanceof Error ? e.message : "Install failed");
    }
  };

  const disabled = installing || source.trim() === "";

  return (
    <DialogShell onClose={onClose}>
      {(requestClose) => (
      <>
      <Text className="text-[17px] font-bold tracking-tight text-foreground">Install skill</Text>
      <Text className="pb-4 pt-1 text-[13px] leading-5 text-muted">
        GitHub repo, URL, or skills.sh link.
      </Text>
      <Text className="pb-1 text-[11px] font-semibold uppercase text-muted">Source</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
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
      <Text className="pb-1 pt-3 text-[11px] font-semibold uppercase text-muted">
        Skill name (optional)
      </Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-lg border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
        enableFocusRing={false}
        focusRingType="none"
        style={INPUT_STYLE}
        onChangeText={setSkillName}
        placeholder="my-skill"
        value={skillName}
      />
      {error ? <Text className="pt-2 text-[12px] text-danger">{error}</Text> : null}
      <View className="flex-row justify-end gap-2 pt-5">
        <Pressable
          accessibilityRole="button"
          className="rounded-lg border border-border bg-surface-muted px-3.5 py-1.5"
          style={CONTINUOUS_CURVE}
          disabled={installing}
          onPress={requestClose}
        >
          <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          className={disabled
            ? "rounded-lg bg-surface-muted px-3.5 py-1.5 opacity-50"
            : "rounded-lg bg-primary px-3.5 py-1.5"}
          style={CONTINUOUS_CURVE}
          disabled={disabled}
          onPress={() => void handleSubmit()}
        >
          <Text className={disabled ? "text-[13px] font-medium text-muted" : "text-[13px] font-semibold text-white"}>
            {installing ? "Installing…" : "Install Skill"}
          </Text>
        </Pressable>
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
      <Text className="text-[15px] font-bold tracking-tight text-foreground">Uninstall skill</Text>
      <Text className="pt-1.5 text-[12px] leading-5 text-muted">
        {`Are you sure you want to uninstall '${skillName}' from your system? This will delete the skill folder and unbind any active workspace symlinks.`}
      </Text>
      <View className="flex-row justify-end gap-2 pt-5">
        <Pressable
          accessibilityRole="button"
          className="rounded-lg border border-border bg-surface-muted px-3.5 py-1.5"
          style={CONTINUOUS_CURVE}
          disabled={uninstalling}
          onPress={requestClose}
        >
          <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-danger px-3.5 py-1.5"
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
