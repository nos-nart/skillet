import { copyText } from "@skillet/skills-fs";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, TextInput, View } from "react-native";
import { Text } from "../AppText";
import type { Skill } from "../services/skills";
import { useThemePalette } from "../services/theme";

// Port of the old PromptsTab (`src/components/tabs/PromptsTab.tsx`):
// searchable trigger catalog; tap a trigger to copy it (old
// `navigator.clipboard` → native `copyText`).
export function PromptsTab({ skills }: { skills: Skill[] }): React.JSX.Element {
  const c = useThemePalette();
  const [search, setSearch] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [copiedTrigger, setCopiedTrigger] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q === "") return skills;
    return skills.filter((s) => {
      const hay = `${s.metadata.trigger ?? `/${s.slug}`} ${s.name} ${s.metadata.description} ${(s.metadata.tools ?? []).join(" ")} ${s.agent}`.toLowerCase();
      return hay.includes(q);
    });
  }, [skills, search]);

  const handleCopy = (trigger: string): void => {
    setCopiedTrigger(trigger);
    void copyText(trigger).catch(() => {});
    setTimeout(() => {
      setCopiedTrigger((prev) => (prev === trigger ? null : prev));
    }, 2000);
  };

  return (
    <View className="flex-1 bg-background">
      <View className="border-b border-border px-8 pb-5 pt-6">
        <View className="flex-row items-center gap-2.5">
          <SFSymbol color={c.primary} name="apple.terminal" size={18} />
          <Text className="text-[18px] font-bold text-foreground">Prompt & Slash Command Catalog</Text>
        </View>
        <Text className="pt-1 text-[14px] text-muted">
          Browse, search, and copy triggers across all your installed skills.
        </Text>
        <View
          className={`mt-4 flex-row items-center gap-2 rounded-lg border bg-surface-muted px-3 py-2 ${
            isFocused ? "border-primary" : "border-border"
          }`}
          style={{ borderCurve: "continuous" }}
        >
          <SFSymbol color={isFocused ? c.primary : c.muted} name="magnifyingglass" size={15} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="min-w-0 flex-1 pl-1 text-[13px] text-foreground"
            enableFocusRing={false}
            focusRingType="none"
            onBlur={() => setIsFocused(false)}
            onChangeText={setSearch}
            onFocus={() => setIsFocused(true)}
            placeholder="Filter triggers, tools, agents..."
            placeholderTextColor={c.muted}
            value={search}
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              className="h-4 w-4 items-center justify-center rounded-full active:opacity-70"
              onPress={() => setSearch("")}
            >
              <SFSymbol color={c.muted} name="xmark.circle.fill" size={14} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView className="flex-1">
        <View className="mx-auto w-full max-w-[1152px] p-4">
          {filtered.length === 0 ? (
            <View className="items-center p-12">
              <Text className="text-[12px] text-muted">
                {skills.length === 0 ? "No skills or prompts detected yet." : "No prompts matching your search."}
              </Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-4">
              {filtered.map((skill) => {
                const trigger = skill.metadata.trigger ?? `/${skill.slug}`;
                const copied = copiedTrigger === trigger;
                return (
                  <View
                    className="min-w-[260px] flex-1 rounded-lg border border-border bg-surface-muted"
                    key={skill.id}
                  >
                    <View className="gap-2 p-4 pb-2">
                      <View className="flex-row items-center justify-between gap-2">
                        <Pressable
                          accessibilityLabel={`Copy trigger ${trigger}`}
                          accessibilityRole="button"
                          className="flex-row items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/15 px-2.5 py-1"
                          onPress={() => handleCopy(trigger)}
                        >
                          <Text className="text-[12px] font-semibold text-primary" mono>
                            {trigger}
                          </Text>
                          <SFSymbol
                            color={copied ? "#10b981" : c.muted}
                            name={copied ? "checkmark" : "doc.on.doc"}
                            size={12}
                          />
                        </Pressable>
                        <View className="rounded-md bg-surface px-2 py-0.5">
                          <Text className="text-[11px] capitalize text-muted">{skill.agent}</Text>
                        </View>
                      </View>
                      <Text className="text-[13px] font-semibold text-foreground" numberOfLines={1}>
                        {skill.name}
                      </Text>
                      <Text className="text-[12px] leading-4 text-muted" numberOfLines={2}>
                        {skill.metadata.description || "No description provided."}
                      </Text>
                    </View>
                    <View className="mt-2 flex-row items-center justify-between border-t border-border px-4 py-2.5">
                      <View className="min-w-0 flex-1 pr-2">
                        <Text className="min-w-0 flex-1 text-[11px] text-muted" mono numberOfLines={1}>
                          {skill.packageName}
                        </Text>
                      </View>
                      {(skill.metadata.tools?.length ?? 0) > 0 ? (
                          <Text className="text-[11px] text-muted" mono>
                          {skill.metadata.tools?.length} tool{(skill.metadata.tools?.length ?? 0) > 1 ? "s" : ""}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
