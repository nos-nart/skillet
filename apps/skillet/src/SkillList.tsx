import { LegendList } from "@legendapp/list/react-native";
import { Pressable, Text, View } from "react-native";

// NOTE: the brief's `Map.groupBy` one-liner needs lib es2024, but the repo
// tsconfig targets ES2022 — equivalent loop keeps the signature/behavior
// (insertion-ordered Map keyed by packageName) with zero shared-config churn.
export function groupByPackage(skills: { packageName: string }[]): Map<string, { packageName: string }[]> {
  const groups = new Map<string, { packageName: string }[]>();
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
}

// Deliberate extension beyond the brief stub: optional selection props so the
// Task 5 "working list/detail selection" Produces clause is real. All brief
// values are verbatim (LegendList, estimatedItemSize 64, keyExtractor id,
// recycleItems, flex-1 row View); the row additionally shows the skill name
// and — when onSelect is provided — reports presses. Task 6 owns rich rows.
export function SkillList({
  skills,
  selectedId,
  onSelect,
}: {
  skills: SkillListItem[];
  selectedId?: string;
  onSelect?: (id: string) => void;
}): React.JSX.Element {
  return (
    <LegendList
      data={skills}
      estimatedItemSize={64}
      extraData={selectedId}
      keyExtractor={(s) => s.id}
      recycleItems
      renderItem={({ item }) => {
        const selected = item.id === selectedId;
        return (
          <View className="px-2">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={selected
                ? "flex-1 flex-row items-center rounded-lg bg-primary px-3 py-2"
                : "flex-1 flex-row items-center rounded-lg px-3 py-2"}
              onPress={() => onSelect?.(item.id)}
            >
              <View className="flex-1">
                <Text
                  className={selected
                    ? "text-[13px] font-semibold text-white"
                    : "text-[13px] text-foreground"}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
            </Pressable>
          </View>
        );
      }}
    />
  );
}
