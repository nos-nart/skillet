import { LegendList } from "@legendapp/list/react-native";
import { SFSymbol } from "@legend-apps/sf-symbol";
import React, { useCallback, useMemo, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Text } from "./AppText";
import { ErrorBanner } from "./ErrorBanner";
import { useThemePalette } from "./services/theme";

const CONTINUOUS_ROW_STYLE = { borderCurve: "continuous" } as const;
const SELECTED_STATE = { selected: true } as const;
const UNSELECTED_STATE = { selected: false } as const;
const FLEX_ONE = { flex: 1 } as const;

interface SkillListItemRowProps {
  item: SkillListItem;
  selected: boolean;
  onSelect?: (id: string) => void;
  mutedColor: string;
}

const SkillListItemRow = React.memo(function SkillListItemRow({
  item,
  selected,
  onSelect,
  mutedColor,
}: SkillListItemRowProps) {
  const trigger = item.trigger ?? `/${item.slug ?? item.name}`;
  const handlePress = useCallback(() => {
    onSelect?.(item.id);
  }, [onSelect, item.id]);

  return (
    <View className="px-2 py-0.5">
      <Pressable
        accessibilityRole="button"
        accessibilityState={selected ? SELECTED_STATE : UNSELECTED_STATE}
        className={selected
          ? "flex-1 flex-row items-center justify-between rounded-lg bg-primary px-3 py-2"
          : "flex-1 flex-row items-center justify-between rounded-lg px-3 py-2 active:bg-surface-muted/80"}
        onPress={handlePress}
        style={CONTINUOUS_ROW_STYLE}
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
        <SFSymbol color={selected ? "#ffffff" : mutedColor} name="chevron.right" size={14} />
      </Pressable>
    </View>
  );
});

function SkillListHeaderRow({
  title,
  count,
  mutedColor,
}: {
  title: string;
  count: number;
  mutedColor: string;
}) {
  return (
    <View className="flex-row items-center gap-1.5 px-4 pb-1 pt-2.5">
      <SFSymbol color={mutedColor} name="shippingbox" size={15} />
      <Text className="min-w-0 flex-1 text-[10px] font-bold uppercase tracking-wider text-muted" numberOfLines={1}>
        {title}
      </Text>
      <Text className="text-[10px] text-muted" mono>{count}</Text>
    </View>
  );
}

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

const SEARCH_FONT_STYLE = { fontFamily: "Space Grotesk" } as const;

interface SkillListToolbarProps {
  skillsCount: number;
  updateCount: number;
  isCheckingUpdates: boolean;
  isLoading: boolean;
  primaryColor: string;
  onNewSkill?: () => void;
  onCheckUpdates?: () => void;
  onRescan?: () => void;
}

const SkillListToolbar = React.memo(function SkillListToolbar({
  skillsCount,
  updateCount,
  isCheckingUpdates,
  isLoading,
  primaryColor,
  onNewSkill,
  onCheckUpdates,
  onRescan,
}: SkillListToolbarProps): React.JSX.Element {
  return (
    <View className="flex-row items-center justify-between gap-1">
      <View className="shrink-0 flex-row items-center gap-1.5">
        <Text className="text-[13px] font-bold text-foreground" numberOfLines={1}>
          {skillsCount} skills
        </Text>
        {updateCount > 0 ? (
          <View
            className="rounded-full bg-primary/15 px-1.5 py-0"
            style={CONTINUOUS_ROW_STYLE}
          >
            <Text className="text-[10px] font-bold text-primary" mono>
              {updateCount}
            </Text>
          </View>
        ) : null}
      </View>
      <View className="shrink-0 flex-row items-center gap-1">
        {onNewSkill ? (
          <Pressable
            accessibilityLabel="Add new skill"
            accessibilityRole="button"
            className="h-7 flex-row items-center gap-1 rounded-md border border-border/80 bg-surface px-2 active:bg-surface-muted"
            onPress={onNewSkill}
            style={CONTINUOUS_ROW_STYLE}
          >
            <SFSymbol color={primaryColor} name="plus" size={16} />
            <Text className="text-[12px] font-medium text-foreground">New</Text>
          </Pressable>
        ) : null}
        {onCheckUpdates ? (
          <Pressable
            accessibilityLabel="Check for updates"
            accessibilityRole="button"
            className="h-7 flex-row items-center gap-1 rounded-md border border-border/80 bg-surface px-2 active:bg-surface-muted"
            disabled={isCheckingUpdates}
            onPress={onCheckUpdates}
            style={CONTINUOUS_ROW_STYLE}
          >
            <SFSymbol color={primaryColor} name="arrow.up.circle" size={16} />
            <Text className="text-[12px] font-medium text-foreground">
              {isCheckingUpdates ? "…" : "Updates"}
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
            style={CONTINUOUS_ROW_STYLE}
          >
            <SFSymbol color={primaryColor} name="arrow.clockwise" size={16} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

interface SkillListSearchBarProps {
  query: string;
  isFocused: boolean;
  primaryColor: string;
  mutedColor: string;
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

const SkillListSearchBar = React.memo(function SkillListSearchBar({
  query,
  isFocused,
  primaryColor,
  mutedColor,
  onFocus,
  onBlur,
  onChangeText,
  onClear,
}: SkillListSearchBarProps): React.JSX.Element {
  return (
    <View
      className={`flex-row items-center gap-2 rounded-lg border bg-surface px-2.5 py-1.5 ${
        isFocused ? "border-primary" : "border-border"
      }`}
      style={CONTINUOUS_ROW_STYLE}
    >
      <SFSymbol color={isFocused ? primaryColor : mutedColor} name="magnifyingglass" size={17} />
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        className="min-w-0 flex-1 pl-1 text-[12px] text-foreground"
        enableFocusRing={false}
        focusRingType="none"
        onBlur={onBlur}
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder="Search skills and prompts..."
        placeholderTextColor={mutedColor}
        style={SEARCH_FONT_STYLE}
        value={query}
      />
      {query.length > 0 ? (
        <Pressable
          accessibilityLabel="Clear search"
          accessibilityRole="button"
          className="h-4 w-4 items-center justify-center rounded-full active:opacity-70"
          onPress={onClear}
        >
          <SFSymbol color={mutedColor} name="xmark.circle.fill" size={16} />
        </Pressable>
      ) : null}
    </View>
  );
});

const getItemType = (r: FlatRow) => r.kind;

export function SkillList({
  skills,
  selectedId,
  onSelect,
  onNewSkill,
  onCheckUpdates,
  onRescan,
  isLoading = false,
  isCheckingUpdates = false,
  error = null,
  onDismissError,
}: {
  skills: SkillListItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  onNewSkill?: () => void;
  onCheckUpdates?: () => void;
  onRescan?: () => void;
  isLoading?: boolean;
  isCheckingUpdates?: boolean;
  error?: string | null;
  onDismissError?: () => void;
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

  const renderItem = useCallback(
    ({ item: row }: { item: FlatRow }) => {
      if (row.kind === "header") {
        return (
          <SkillListHeaderRow
            count={row.count}
            mutedColor={c.muted}
            title={row.title}
          />
        );
      }
      return (
        <SkillListItemRow
          item={row.item}
          mutedColor={c.muted}
          onSelect={onSelect}
          selected={row.item.id === selectedId}
        />
      );
    },
    [c.muted, onSelect, selectedId],
  );

  const handleClearQuery = useCallback(() => setQuery(""), []);
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  return (
    <View className="flex-1 border-r border-border bg-surface">
      <View className="gap-2 border-b border-border px-3 pb-2.5 pt-3">
        {showToolbar ? (
          <SkillListToolbar
            isCheckingUpdates={isCheckingUpdates}
            isLoading={isLoading}
            onCheckUpdates={onCheckUpdates}
            onNewSkill={onNewSkill}
            onRescan={onRescan}
            primaryColor={c.primary}
            skillsCount={skills.length}
            updateCount={updateCount}
          />
        ) : null}
        <SkillListSearchBar
          isFocused={isFocused}
          mutedColor={c.muted}
          onBlur={handleBlur}
          onChangeText={setQuery}
          onClear={handleClearQuery}
          onFocus={handleFocus}
          primaryColor={c.primary}
          query={query}
        />
        <ErrorBanner error={error} onDismiss={onDismissError} />
        <Text className="px-1 pt-0.5 text-[11px] text-muted">
          {skills.length} skills{filtered.length !== skills.length ? ` · ${filtered.length} shown` : ""}
        </Text>
      </View>
      <LegendList
        data={rows}
        estimatedItemSize={64}
        extraData={`${selectedId ?? ""}:${query}`}
        getItemType={getItemType}
        keyExtractor={(r) => r.key}
        recycleItems
        renderItem={renderItem}
        style={FLEX_ONE}
      />
    </View>
  );
}
