import { sidebarSplitViewTitlebarMetrics } from "@legend-apps/appkit-split-view";
import { openFileDialog } from "@legend-apps/file-dialog";
import { useCallback, useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SkillList } from "./SkillList";
import { getSkills, type Skill } from "./services/skills";
import {
  addWorkspace,
  getWorkspaces,
  setCurrentWorkspace,
  type Workspace,
} from "./services/workspaces";

type SidebarNav = "skills" | "discover";

function workspaceName(path: string): string {
  const base = path.replace(/\/+$/, "").split("/").pop() ?? path;
  return base === "" ? path : base;
}

export function Sidebar({
  selectedId,
  onSelect,
  onSkills,
}: {
  selectedId?: string;
  onSelect?: (id: string) => void;
  // Task 6 lift: App needs the loaded skills to resolve the selected Skill
  // for the detail pane. Reported once per successful fetch (not per render).
  onSkills?: (skills: Skill[]) => void;
}): React.JSX.Element {
  const [nav, setNav] = useState<SidebarNav>("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);

  const refreshWorkspaces = useCallback(async () => {
    const list = await getWorkspaces();
    setWorkspaces(list);
    setCurrentPath(list.find((w) => w.isCurrent)?.path ?? list[0]?.path);
  }, []);

  useEffect(() => {
    void getSkills().then(
      (list) => {
        setSkills(list);
        onSkills?.(list);
      },
      () => setSkills([]),
    );
    void refreshWorkspaces();
  }, [refreshWorkspaces, onSkills]);

  const handleSelectWorkspace = useCallback(async (id: string) => {
    await setCurrentWorkspace(id);
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  // file-dialog returns absolute paths, which is exactly what the skills-fs
  // toggle surface requires (`symlink`/`unlink` do NOT expand `~` — Task 3).
  const handleAddWorkspace = useCallback(async () => {
    const picked = await openFileDialog({
      allowsMultipleSelection: false,
      canChooseDirectories: true,
      canChooseFiles: false,
      prompt: "Add workspace",
    });
    const path = picked?.[0];
    if (!path) return;
    await addWorkspace({ id: path, name: workspaceName(path), path });
    await setCurrentWorkspace(path);
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  return (
    <View
      className="flex-1 bg-surface-muted"
      style={{ paddingTop: sidebarSplitViewTitlebarMetrics.sidebarInsetTop }}
    >
      <View className="px-4 pb-2 pt-2">
        <Text className="text-[14px] font-bold text-foreground">Skillet</Text>
      </View>

      <View className="flex-row gap-1 px-3">
        {(["skills", "discover"] as const).map((tab) => {
          const active = nav === tab;
          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={active ? "rounded-md bg-border px-3 py-1" : "rounded-md px-3 py-1"}
              key={tab}
              onPress={() => setNav(tab)}
            >
              <Text className="text-[12px] font-semibold capitalize text-foreground">
                {tab}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="px-4 pb-1 pt-3">
        <Text className="text-[11px] font-semibold uppercase text-muted">Workspace</Text>
      </View>
      {workspaces.map((ws) => {
        const active = ws.path === currentPath;
        return (
          <View className="px-2" key={ws.id}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={active
                ? "flex-row items-center rounded-md bg-primary px-3 py-1"
                : "flex-row items-center rounded-md px-3 py-1"}
              onPress={() => void handleSelectWorkspace(ws.id)}
            >
              <Text
                className={active ? "flex-1 text-[12px] text-white" : "flex-1 text-[12px] text-foreground"}
                numberOfLines={1}
              >
                {ws.name}
              </Text>
            </Pressable>
          </View>
        );
      })}
      <View className="px-2">
        <Pressable
          accessibilityRole="button"
          className="flex-row items-center rounded-md px-3 py-1"
          onPress={() => void handleAddWorkspace()}
        >
          <Text className="text-[12px] text-primary">+ Add workspace…</Text>
        </Pressable>
      </View>

      <View className="px-4 pb-1 pt-3">
        <Text className="text-[11px] font-semibold uppercase text-muted">
          Skills{skills.length > 0 ? ` · ${skills.length}` : ""}
        </Text>
      </View>
      <View className="flex-1">
        {nav === "skills" ? (
          <SkillList onSelect={onSelect} selectedId={selectedId} skills={skills} />
        ) : (
          <View className="items-center px-6 pt-8">
            <Text className="text-center text-[12px] text-muted">
              Discover lands in Task 7.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
