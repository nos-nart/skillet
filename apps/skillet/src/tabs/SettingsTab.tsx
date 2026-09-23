import { useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "../AppText";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { getGithubToken, saveGithubToken } from "../services/settings";
import { setAppTheme, useAppTheme, useThemePalette } from "../services/theme";

// Port of the old SettingsTab (`src/components/tabs/SettingsTab.tsx`):
// GitHub token (rate limits for discovery + update checks), theme switch,
// runtime info.
export function SettingsTab(): React.JSX.Element {
  const c = useThemePalette();
  const theme = useAppTheme();
  const [token, setToken] = useState(() => getGithubToken() ?? "");
  const [saved, setSaved] = useState(false);

  const handleSave = (): void => {
    saveGithubToken(token);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="mx-auto w-full max-w-[640px] gap-6 p-8">
        <View>
          <View className="flex-row items-center gap-2.5">
            <SFSymbol color={c.muted} name="gearshape" size={20} />
            <Text className="text-[20px] font-bold text-foreground">Settings & Preferences</Text>
          </View>
          <Text className="pt-1 text-[14px] text-muted">
            Configure GitHub API tokens, discovery directories, and runtime preferences.
          </Text>
        </View>

        <View className="gap-3 rounded-lg border border-border bg-surface-muted p-5" style={{ borderCurve: "continuous" }}>
          <Text className="text-[14px] font-semibold text-foreground">
            GitHub Personal Access Token (Optional)
          </Text>
          <Text className="text-[13px] leading-5 text-muted">
            Used to increase rate limits when discovering remote skills and checking for updates.
          </Text>
          <View className="flex-row items-center gap-2 pt-1">
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground"
              enableFocusRing={false}
              focusRingType="none"
              onChangeText={setToken}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              placeholderTextColor={c.muted}
              secureTextEntry
              style={{ fontFamily: "JetBrains Mono", borderCurve: "continuous" }}
              value={token}
            />
            <Pressable
              accessibilityRole="button"
              className="rounded-lg bg-primary px-4 py-2"
              style={{ borderCurve: "continuous" }}
              onPress={handleSave}
            >
              <Text className="text-[13px] font-semibold text-white">
                {saved ? "Saved!" : "Save"}
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-3 rounded-lg border border-border bg-surface-muted p-5" style={{ borderCurve: "continuous" }}>
          <Text className="text-[14px] font-semibold text-foreground">Theme Appearance</Text>
          <Text className="text-[13px] text-muted">Choose your preferred interface theme.</Text>
          <View className="flex-row gap-2 pt-1">
            <Pressable
              accessibilityRole="button"
              className={theme === "dark"
                ? "flex-row items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5"
                : "flex-row items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5"}
              style={{ borderCurve: "continuous" }}
              onPress={() => setAppTheme("dark")}
            >
              <SFSymbol color={theme === "dark" ? c.white : c.muted} name="moon" size={15} />
              <Text className={theme === "dark" ? "text-[13px] font-semibold text-white" : "text-[13px] text-muted"}>
                Dark Mode
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className={theme === "light"
                ? "flex-row items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5"
                : "flex-row items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-1.5"}
              style={{ borderCurve: "continuous" }}
              onPress={() => setAppTheme("light")}
            >
              <SFSymbol color={theme === "light" ? c.white : c.muted} name="sun.max" size={15} />
              <Text className={theme === "light" ? "text-[13px] font-semibold text-white" : "text-[13px] text-muted"}>
                Light Mode
              </Text>
            </Pressable>
          </View>
        </View>

        <View className="gap-2 rounded-lg border border-border bg-surface-muted p-5" style={{ borderCurve: "continuous" }}>
          <Text className="text-[14px] font-semibold text-foreground">Application Runtime</Text>
          <Text className="text-[13px] leading-5 text-muted">
            Skillet v2.0.0 (React Native macOS · Uniwind · Legend List)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
