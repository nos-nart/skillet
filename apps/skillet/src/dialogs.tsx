import { useState } from "react";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
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
        className="flex-1 items-center justify-center bg-black/40 px-8"
        onPress={onClose}
      >
        <Pressable
          className="w-full max-w-[420px] rounded-xl border border-border bg-background p-5"
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
    if (!parseGitHubRepo(trimmed)) {
      setLocalError("Enter a valid skill source (owner/repo or GitHub URL).");
      return;
    }
    setLocalError(null);
    await onInstall(trimmed, skillName.trim() === "" ? undefined : skillName.trim());
  };

  const disabled = installing || source.trim() === "";

  return (
    <DialogShell onClose={onClose}>
      <Text className="text-[14px] font-bold text-foreground">Install skill</Text>
      <Text className="pb-3 pt-1 text-[12px] text-muted">
        GitHub repo, URL, or skills.sh link.
      </Text>
      <Text className="pb-1 text-[11px] font-semibold uppercase text-muted">Source</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="rounded-md border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
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
        className="rounded-md border border-border bg-surface-muted px-3 py-2 text-[13px] text-foreground"
        onChangeText={setSkillName}
        placeholder="my-skill"
        value={skillName}
      />
      {error ? <Text className="pt-2 text-[12px] text-danger">{error}</Text> : null}
      <View className="flex-row justify-end gap-2 pt-4">
        <Pressable
          accessibilityRole="button"
          className="rounded-md px-3 py-1.5"
          disabled={installing}
          onPress={onClose}
        >
          <Text className="text-[13px] text-muted">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          className={disabled ? "rounded-md bg-border px-3 py-1.5" : "rounded-md bg-primary px-3 py-1.5"}
          disabled={disabled}
          onPress={() => void handleSubmit()}
        >
          <Text className="text-[13px] font-semibold text-white">
            {installing ? "Installing…" : "Install skill"}
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
      <Text className="text-[14px] font-bold text-foreground">Uninstall skill</Text>
      <Text className="pt-1 text-[12px] text-muted">
        {`Are you sure you want to uninstall '${skillName}' from your system? This will delete the skill folder and unbind any active workspace symlinks.`}
      </Text>
      <View className="flex-row justify-end gap-2 pt-4">
        <Pressable
          accessibilityRole="button"
          className="rounded-md px-3 py-1.5"
          disabled={uninstalling}
          onPress={onClose}
        >
          <Text className="text-[13px] text-muted">Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          className="rounded-md bg-danger px-3 py-1.5"
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
