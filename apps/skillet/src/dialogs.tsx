import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import { Text } from "./AppText";
import { parseGitHubRepo } from "./services/github";

// Native-modal ports of the web dialogs (`src/components/NewSkillDialog.tsx`
// install mode + `src/components/ConfirmDialog.tsx` destructive variant).
// Spec §2: `ConfirmDialog` → native modal, `NewSkillDialog` form → `TextInput`,
// URL regex stays (here: `parseGitHubRepo` validation from Task 3). Errors
// render inline — never `alert()`.

function DialogShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible>
      <Pressable
        accessibilityRole="button"
        className="flex-1 items-center justify-center bg-black/50 px-8"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-[420px] rounded-lg border border-border bg-background p-6"
          style={{ borderCurve: "continuous" }}
          onPress={(e) => e.stopPropagation()}
        >
          {children}
        </Pressable>
      </Pressable>
    </Modal>
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
      <Text className="text-[17px] font-bold text-foreground">Install skill</Text>
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
        style={{ borderCurve: "continuous", fontFamily: "Space Grotesk" }}
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
        style={{ borderCurve: "continuous", fontFamily: "Space Grotesk" }}
        onChangeText={setSkillName}
        placeholder="my-skill"
        value={skillName}
      />
      {error ? <Text className="pt-2 text-[12px] text-danger">{error}</Text> : null}
      <View className="flex-row justify-end gap-2 pt-5">
        <Pressable
          accessibilityRole="button"
          className="rounded-lg border border-border bg-surface-muted px-3.5 py-1.5"
          style={{ borderCurve: "continuous" }}
          disabled={installing}
          onPress={onClose}
        >
          <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          className={disabled
            ? "rounded-lg bg-surface-muted px-3.5 py-1.5 opacity-50"
            : "rounded-lg bg-primary px-3.5 py-1.5"}
          style={{ borderCurve: "continuous" }}
          disabled={disabled}
          onPress={() => void handleSubmit()}
        >
          <Text className={disabled ? "text-[13px] font-medium text-muted" : "text-[13px] font-semibold text-white"}>
            {installing ? "Installing…" : "Install Skill"}
          </Text>
        </Pressable>
      </View>
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
      <Text className="text-[15px] font-bold text-foreground">Uninstall skill</Text>
      <Text className="pt-1.5 text-[12px] leading-5 text-muted">
        {`Are you sure you want to uninstall '${skillName}' from your system? This will delete the skill folder and unbind any active workspace symlinks.`}
      </Text>
      <View className="flex-row justify-end gap-2 pt-5">
        <Pressable
          accessibilityRole="button"
          className="rounded-lg border border-border bg-surface-muted px-3.5 py-1.5"
          style={{ borderCurve: "continuous" }}
          disabled={uninstalling}
          onPress={onClose}
        >
          <Text className="text-[13px] font-medium text-foreground">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-lg bg-danger px-3.5 py-1.5"
          style={{ borderCurve: "continuous" }}
          disabled={uninstalling}
          onPress={onConfirm}
        >
          <Text className="text-[13px] font-semibold text-white">
            {uninstalling ? "Removing…" : "Uninstall"}
          </Text>
        </Pressable>
      </View>
    </DialogShell>
  );
}
