import { SFSymbol } from "@legendapp/spark/ui/symbol";
import { useState } from "react";
import { Image, Pressable, View, type TextStyle } from "react-native";
import { Text } from "./AppText";
import { ErrorBanner } from "./ErrorBanner";
import { SKILLET_APP_ICON_URI } from "./assets/appIcon";
import { pickDirectory } from "./services/pickDirectory";
import { toggleAppTheme, useAppTheme, useThemePalette } from "./services/theme";
import type { Workspace } from "./services/workspaces";

const CONTINUOUS_CURVE = { borderCurve: "continuous" } as const;
const TABULAR_NUMS: TextStyle = { fontVariant: ["tabular-nums"] };
const IMAGE_SIZE = { width: 32, height: 32 } as const;

export type SidebarNav = "skills" | "discover" | "agents" | "settings";

function workspaceName(path: string): string {
  const base = path.replace(/\/+$/, "").split("/").pop() ?? path;
  return base === "" ? path : base;
}

function shortPath(path: string): string {
  return path.replace(/^\/Users\/[^/]+/, "~");
}

export function Sidebar({
  currentTab,
  onTab,
  skillsCount,
  workspaces,
  currentPath,
  onSelectWorkspace,
  onAddWorkspace,
  error = null,
  onDismissError,
}: {
  currentTab: SidebarNav;
  onTab: (tab: SidebarNav) => void;
  skillsCount: number;
  workspaces: Workspace[];
  currentPath?: string;
  onSelectWorkspace: (id: string) => void;
  onAddWorkspace: (path: string) => void;
  error?: string | null;
  onDismissError?: () => void;
}): React.JSX.Element {
  const theme = useAppTheme();
  const c = useThemePalette();
  const [pickerOpen, setPickerOpen] = useState(false);

  const current = workspaces.find((w) => w.path === currentPath) ?? workspaces[0];

  const navItems = [
    { tab: "skills" as const, label: "Skills", icon: "sparkles", count: skillsCount },
    { tab: "discover" as const, label: "Discover", icon: "safari" },
    { tab: "agents" as const, label: "Agents", icon: "cpu" },
  ];

  const handleAddWorkspace = (): void => {
    void pickDirectory("Add workspace").then((path) => {
      if (path) onAddWorkspace(path);
    });
  };

  return (
    <View className="flex-1 bg-surface-muted">
      <View className="flex-row items-center justify-between px-3.5 pb-2 pt-3.5">
        <View className="min-w-0 flex-1 flex-row items-center gap-2.5">
          <View
            className="h-8 w-8 shrink-0 overflow-hidden rounded-[9px] border border-border/60"
            style={CONTINUOUS_CURVE}
          >
            <Image
              accessibilityLabel="Skillet app icon"
              source={{ uri: SKILLET_APP_ICON_URI }}
              style={IMAGE_SIZE}
            />
          </View>
          <View className="min-w-0 flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-[14px] font-bold tracking-tight text-foreground">Skillet</Text>
              <View
                className="rounded-full border border-primary/25 bg-primary/12 px-1.5 py-0.5"
                style={CONTINUOUS_CURVE}
              >
                <Text className="text-[10px] font-bold text-primary" mono style={TABULAR_NUMS}>
                  v2.0
                </Text>
              </View>
            </View>
            <Text className="text-[11px] text-muted" ellipsizeMode="tail" numberOfLines={1}>
              Universal Skills & Prompts
            </Text>
          </View>
        </View>
        <Pressable
          accessibilityLabel={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          accessibilityRole="button"
          className="ml-2 h-7 w-7 shrink-0 items-center justify-center rounded-[8px] border border-border bg-surface active:opacity-75"
          onPress={() => toggleAppTheme()}
          style={CONTINUOUS_CURVE}
        >
          {theme === "dark" ? (
            <SFSymbol color={c.muted} name="sun.max" size={15} />
          ) : (
            <SFSymbol color={c.muted} name="moon" size={15} />
          )}
        </Pressable>
      </View>

      <View className="gap-1.5 px-3 pb-2 pt-2">
        <View className="flex-row items-center justify-between px-1">
          <Text className="min-w-0 flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted" numberOfLines={1}>
            Workspace Scope
          </Text>
          <Pressable
            accessibilityLabel="Add workspace folder"
            accessibilityRole="button"
            className="h-6 w-6 shrink-0 items-center justify-center rounded-md active:opacity-60"
            onPress={handleAddWorkspace}
          >
            <SFSymbol color={c.primary} name="folder.badge.plus" size={15} />
          </Pressable>
        </View>

        <View
          className="overflow-hidden rounded-[10px] border border-border bg-surface"
          style={CONTINUOUS_CURVE}
        >
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-2 px-3 py-2 active:opacity-75"
            onPress={() => setPickerOpen((v) => !v)}
          >
            <SFSymbol color={c.primary} name="arrow.triangle.branch" size={14} />
            <Text className="min-w-0 flex-1 text-[12px] font-medium text-foreground" numberOfLines={1}>
              {current ? `${current.name} (${shortPath(current.path)})` : "Select workspace…"}
            </Text>
            <SFSymbol color={c.muted} name="chevron.down" size={11} />
          </Pressable>
          {pickerOpen
            ? workspaces.filter((w) => w.path !== current?.path).map((ws) => (
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-2 border-t border-border/70 px-3 py-2 active:opacity-75"
                key={ws.id}
                onPress={() => {
                  setPickerOpen(false);
                  onSelectWorkspace(ws.id);
                }}
              >
                <Text className="min-w-0 flex-1 text-[12px] text-foreground" numberOfLines={1}>
                  {`${ws.name} (${shortPath(ws.path)})`}
                </Text>
              </Pressable>
            ))
            : null}
        </View>
        <ErrorBanner error={error} onDismiss={onDismissError} />
      </View>

      <View className="gap-1 px-2.5 pt-1.5">
        {navItems.map(({ tab, label, icon, count }) => {
          const active = currentTab === tab;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={active
                ? "flex-row items-center justify-between rounded-[10px] border border-border/80 bg-surface px-3 py-2"
                : "flex-row items-center justify-between rounded-[10px] px-3 py-2 active:bg-surface/60"}
              key={tab}
              onPress={() => onTab(tab)}
              style={CONTINUOUS_CURVE}
            >
              <View className="flex-row items-center gap-2.5">
                <SFSymbol color={active ? c.primary : c.muted} name={icon} size={16} />
                <Text className={active
                  ? "text-[13px] font-semibold text-foreground"
                  : "text-[13px] font-medium text-muted"}
                >
                  {label}
                </Text>
              </View>
              {count !== undefined && count > 0 ? (
                <View
                  className={active
                    ? "rounded-full bg-primary/15 px-2 py-0.5"
                    : "rounded-full bg-surface px-2 py-0.5"}
                  style={CONTINUOUS_CURVE}
                >
                  <Text
                    className={active ? "text-[10px] font-bold text-primary" : "text-[10px] font-semibold text-muted"}
                    mono
                    style={TABULAR_NUMS}
                  >
                    {count}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View className="flex-1" />

      <View className="border-t border-border/80 px-2.5 py-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: currentTab === "settings" }}
          className={currentTab === "settings"
            ? "flex-row items-center gap-2.5 rounded-[10px] border border-border/80 bg-surface px-3 py-2"
            : "flex-row items-center gap-2.5 rounded-[10px] px-3 py-2 active:bg-surface/60"}
          onPress={() => onTab("settings")}
          style={CONTINUOUS_CURVE}
        >
          <SFSymbol
            color={currentTab === "settings" ? c.primary : c.muted}
            name="gearshape"
            size={16}
          />
          <Text className={currentTab === "settings"
            ? "text-[13px] font-semibold text-foreground"
            : "text-[13px] font-medium text-muted"}
          >
            Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export { workspaceName };
