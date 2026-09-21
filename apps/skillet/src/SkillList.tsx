import { LegendList } from "@legendapp/list/react-native";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Text } from "./AppText";
import { useThemePalette } from "./services/theme";

// NOTE: the brief's `Map.groupBy` one-liner needs lib es2024, but the repo
// tsconfig targets ES2022 — equivalent loop keeps the signature/behavior
// (insertion-ordered Map keyed by packageName) with zero shared-config churn.
export function groupByPackage<T extends { packageName: string }>(skills: T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const skill of skills) {
    const list = groups.get(skill.packageName);
    if (list) {
      list.push(skill);
    } else {
      groups.set(skill.packageName, [skill]);
    }
  }
  return groups;
}

export interface SkillListItem {
  id: string;
  name: string;
  slug?: string;
  packageName?: string;
  trigger?: string;
  description?: string;
  updateAvailable?: boolean;
}

type FlatRow =
  | { kind: "header"; key: string; title: string; count: number }
  | { kind: "item"; key: string; item: SkillListItem };

// Rich list matching the old Deno UI (`src/components/SkillList.tsx`):
// toolbar (count + New/Updates/rescan), search field, package-grouped
// sections, mono trigger + description rows. Selected row uses Skillet's
// signature brand orange (`bg-primary`).
export function SkillList({
  skills,
  selectedId,
  onSelect,
  onNewSkill,
  onCheckUpdates,
  onRescan,
  isLoading = false,
  isCheckingUpdates = false,
}: {
  skills: SkillListItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onNewSkill?: () => void;
  onCheckUpdates?: () => void;
  onRescan?: () => void;
  isLoading?: boolean;
  isCheckingUpdates?: boolean;
}): React.JSX.Element {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const c = useThemePalette();
  const showToolbar = onNewSkill !== undefined || onCheckUpdates !== undefined || onRescan !== undefined;
  const updateCount = skills.filter((s) => s.updateAvailable).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.slug && s.slug.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.packageName && s.packageName.toLowerCase().includes(q)) ||
        (s.trigger && s.trigger.toLowerCase().includes(q)),
    );
  }, [skills, query]);

  const rows = useMemo<FlatRow[]>(() => {
    const groups = groupByPackage(
      filtered.map((s) => ({ ...s, packageName: s.packageName ?? "Global skills" })),
    );
    const out: FlatRow[] = [];
    for (const [pkg, list] of groups) {
      out.push({ kind: "header", key: `header:${pkg}`, title: pkg, count: list.length });
      for (const item of list) out.push({ kind: "item", key: item.id, item });
    }
    return out;
  }, [filtered]);

  return (
    <View className="flex-1 border-r border-border bg-surface">
      <View className="gap-2 border-b border-border px-3 pb-2.5 pt-3">
        {showToolbar ? (
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[13px] font-bold text-foreground">
                {skills.length} skills
              </Text>
              {updateCount > 0 ? (
                <View
                  className="rounded-full bg-primary/15 px-1.5 py-0"
                  style={{ borderCurve: "continuous" }}
                >
                  <Text className="text-[10px] font-bold text-primary" mono>
                    {updateCount} updates
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1">
              {onNewSkill ? (
                <Pressable
                  accessibilityLabel="Add new skill"
                  accessibilityRole="button"
                  className="h-7 flex-row items-center gap-1.5 rounded-md border border-border/80 bg-surface px-2.5 active:bg-surface-muted"
                  onPress={onNewSkill}
                  style={{ borderCurve: "continuous" }}
                >
                  <SFSymbol color={c.primary} name="plus" size={14} />
                  <Text className="text-[12px] font-medium text-foreground">New</Text>
                </Pressable>
              ) : null}
              {onCheckUpdates ? (
                <Pressable
                  accessibilityLabel="Check for updates"
                  accessibilityRole="button"
                  className="h-7 flex-row items-center gap-1.5 rounded-md border border-border/80 bg-surface px-2.5 active:bg-surface-muted"
                  disabled={isCheckingUpdates}
                  onPress={onCheckUpdates}
                  style={{ borderCurve: "continuous" }}
                >
                  <SFSymbol color={c.primary} name="arrow.up.circle" size={15} />
                  <Text className="text-[12px] font-medium text-foreground">
                    {isCheckingUpdates ? "Checking…" : "Updates"}
                  </Text>
                </Pressable>
              ) : null}
              {onRescan ? (
                <Pressable
                  accessibilityLabel="Rescan local directories"
                  accessibilityRole="button"
                  className="h-7 w-7 items-center justify-center rounded-md border border-border/80 bg-surface active:bg-surface-muted"
                  disabled={isLoading}
                  onPress={onRescan}
                  style={{ borderCurve: "continuous" }}
                >
                  <SFSymbol color={c.primary} name="arrow.clockwise" size={15} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}
        <View
          className={`flex-row items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 ${
            isFocused ? "border-primary" : "border-border"
          }`}
          style={{ borderCurve: "continuous" }}
        >
          <SFSymbol color={isFocused ? c.primary : c.muted} name="magnifyingglass" size={15} />
          <TextInput
            autoCapitalize="none"
            autoCorrect={false}
            className="min-w-0 flex-1 pl-1 text-[12px] text-foreground"
            enableFocusRing={false}
            focusRingType="none"
            onBlur={() => setIsFocused(false)}
            onChangeText={setQuery}
            onFocus={() => setIsFocused(true)}
            placeholder="Search skills and prompts..."
            placeholderTextColor={c.muted}
            value={query}
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              className="h-4 w-4 items-center justify-center rounded-full active:opacity-70"
              onPress={() => setQuery("")}
            >
              <SFSymbol color={c.muted} name="xmark.circle.fill" size={14} />
            </Pressable>
          ) : null}
        </View>
        <Text className="px-1 pt-0.5 text-[11px] text-muted">
          {skills.length} skills{filtered.length !== skills.length ? ` · ${filtered.length} shown` : ""}
        </Text>
      </View>
      <LegendList
        data={rows}
        estimatedItemSize={64}
        extraData={`${selectedId ?? ""}:${query}`}
        keyExtractor={(r) => r.key}
        recycleItems
        style={{ flex: 1 }}
        renderItem={({ item: row }) => {
          if (row.kind === "header") {
            return (
              <View className="flex-row items-center gap-1.5 px-4 pb-1 pt-2.5">
                <SFSymbol color={c.muted} name="shippingbox" size={14} />
                <Text className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-muted" numberOfLines={1}>
                  {row.title}
                </Text>
                <Text className="text-[10px] text-muted" mono>{row.count}</Text>
              </View>
            );
          }
          const item = row.item;
          const selected = item.id === selectedId;
          const trigger = item.trigger ?? `/${item.slug ?? item.name}`;
          return (
            <View className="px-2 py-0.5">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                className={selected
                  ? "flex-1 flex-row items-center justify-between rounded-lg bg-primary px-3 py-2"
                  : "flex-1 flex-row items-center justify-between rounded-lg px-3 py-2 active:bg-surface-muted/80"}
                onPress={() => onSelect?.(item.id)}
                style={{ borderCurve: "continuous" }}
              >
                <View className="min-w-0 flex-1 pr-2">
                  <View className="flex-row items-center gap-1.5">
                    <Text
                      className={selected
                        ? "text-[13px] font-bold text-white"
                        : "text-[13px] font-semibold text-foreground"}
                      mono
                      numberOfLines={1}
                    >
                      {trigger}
                    </Text>
                    {item.updateAvailable ? (
                      <View className={`h-1.5 w-1.5 rounded-full ${selected ? "bg-white" : "bg-amber-500"}`} />
                    ) : null}
                  </View>
                  <Text
                    className={selected ? "pt-0.5 text-[12px] text-white/95" : "pt-0.5 text-[12px] text-muted"}
                    numberOfLines={1}
                  >
                    {item.description ?? item.name}
                  </Text>
                </View>
                <SFSymbol color={selected ? "#ffffff" : c.muted} name="chevron.right" size={12} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}
