import { WindowProvider } from "./windows";
import { setMainWindowOptions } from "@legend-apps/window-manager";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { RegistryProvider } from "@effect/atom-react";
import { Sidebar, workspaceName, type SidebarNav } from "./Sidebar";
import { SkillDetail } from "./SkillDetail";
import { SkillList } from "./SkillList";
import { ResizeHandle } from "./ResizeHandle";
import { InstallSkillDialog } from "./dialogs";
import { AgentsTab } from "./tabs/AgentsTab";
import { DiscoverTab } from "./tabs/DiscoverTab";
import { SettingsTab } from "./tabs/SettingsTab";
import {
  downloadSkill,
  getSkills,
  toggleSkill,
  uninstallSkill,
  type Skill,
} from "./services/skills";
import { getGithubToken } from "./services/settings";
import { checkSkillUpdates, updateSkill } from "./services/updater";
import { applyStoredTheme, useAppTheme } from "./services/theme";
import {
  addWorkspace,
  getWorkspaces,
  setCurrentWorkspace,
  type Workspace,
} from "./services/workspaces";

// Skillet defaults to dark theme with its signature brand Orange accent
// (#f97316 / #ea580c / #fb923c). Uniwind defaults to light/system, which
// rendered as broken white, so apply the persisted theme here.
applyStoredTheme();

// 3-pane layout matching the old Deno UI (`src/App.tsx` ResizablePanelGroup):
// nav sidebar | skill list | detail, every boundary natively draggable. The
// native split view only has 2 slots (sidebar | content), so the content slot
// hosts a nested split (list | detail).
//
// NOTE: the skillet window is a standard titled NSWindow (AppDelegate never
// enables FullSizeContentView for this app), so there is a REAL titlebar and
// no fake 42/52pt titlebar insets — those only added dead space.
export function App(): React.JSX.Element {
  const theme = useAppTheme();
  const [nav, setNav] = useState<SidebarNav>("skills");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentPath, setCurrentPath] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [newSkillOpen, setNewSkillOpen] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  // Middle column width (old ResizablePanel defaultSize ~27% ≈ 300pt).
  const [listWidth, setListWidth] = useState(300);
  const listWidthRef = useRef(300);
  const dragAnchor = useRef(300);
  // Nav column width (default ~240pt, min 200pt).
  const [navWidth, setNavWidth] = useState(240);
  const navWidthRef = useRef(240);
  const navDragAnchor = useRef(240);
  const skillsRequestIdRef = useRef(0);
  const selectedSkill = skills.find((s) => s.id === selectedId) ?? null;

  const skillListItems = useMemo(
    () =>
      skills.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        packageName: s.packageName,
        trigger: s.metadata.trigger ?? `/${s.slug}`,
        description: s.metadata.description || s.name,
        updateAvailable: s.updateAvailable,
      })),
    [skills],
  );

  const refreshSkills = useCallback(async (): Promise<void> => {
    const requestId = ++skillsRequestIdRef.current;
    setIsLoading(true);
    try {
      const list = await getSkills();
      if (skillsRequestIdRef.current !== requestId) return;
      setSkills(list);
      // Keep the selection alive across re-scans; default to the first skill
      // like the old UI (LOAD_SKILLS_SUCCESS auto-selects).
      setSelectedId((prev) => {
        if (prev && list.some((s) => s.id === prev)) return prev;
        return list[0]?.id;
      });
    } catch {
      // Keep the last good list.
    } finally {
      if (skillsRequestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const list = await getWorkspaces();
      setWorkspaces(list);
      setCurrentPath((prev) =>
        prev && list.some((w) => w.path === prev)
          ? prev
          : (list.find((w) => w.isCurrent)?.path ?? list[0]?.path),
      );
    } catch {
      // Keep the last good list.
    }
  }, []);

  useEffect(() => {
    void refreshSkills();
    void refreshWorkspaces();
  }, [refreshSkills, refreshWorkspaces]);

  // Native controls (Switch, window chrome) follow NSAppearance, not Uniwind —
  // keep the window on the app theme like the old `html.dark` class did.
  useEffect(() => {
    void setMainWindowOptions({
      windowStyle: {
        appearance: theme,
        backgroundColor: theme === "dark" ? "#191A1B" : "#f5f6f8",
      },
    }).catch(() => {});
  }, [theme]);

  const handleToggle = useCallback(
    async (workspace: Workspace, enable: boolean): Promise<boolean> => {
      const skill = skills.find((s) => s.id === selectedId) ?? null;
      if (!skill) return false;
      return toggleSkill({
        skillSlug: skill.slug,
        sourcePath: skill.path,
        workspacePath: workspace.path,
        enable,
      });
    },
    [skills, selectedId],
  );

  // Installs whatever source the InstallSkillDialog collected (not the
  // selected skill — see SkillDetail): refresh re-resolves the selection.
  const handleInstallSkill = useCallback(
    async (source: string, skillName?: string): Promise<void> => {
      const res = await downloadSkill({ source, skillName });
      if (!res.ok) throw new Error(res.error);
      await refreshSkills();
    },
    [refreshSkills],
  );

  // Old `handleCheckUpdates`: diffs installed packages against the lockfile +
  // GitHub HEAD, then flags skills in place (no re-scan wipes the flags).
  const handleCheckUpdates = useCallback(async (): Promise<void> => {
    setIsCheckingUpdates(true);
    try {
      const token = getGithubToken();
      const map = await checkSkillUpdates(skills, { token });
      setSkills((prev) =>
        prev.map((s) => ({ ...s, updateAvailable: map[s.packageName] ?? false })),
      );
    } catch (cause: unknown) {
      console.error("Update check failed:", cause);
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [skills]);

  // Old `handleUpdateSkill`: reinstalls from the recorded package source.
  const handleUpdateSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      await updateSkill(skill, { token: getGithubToken() });
      await refreshSkills();
    },
    [refreshSkills],
  );

  // Deletes the installed skill dir plus its workspace symlinks.
  const handleUninstallSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      const ok = await uninstallSkill({
        skillPath: skill.path,
        skillSlug: skill.slug,
        workspacePaths: workspaces.map((w) => w.path),
      });
      if (!ok) throw new Error(`Could not uninstall ${skill.name}.`);
      if (selectedId === skill.id) setSelectedId(undefined);
      await refreshSkills();
    },
    [refreshSkills, selectedId, workspaces],
  );

  const handleSelectWorkspace = useCallback(async (id: string) => {
    await setCurrentWorkspace(id);
    const list = await getWorkspaces().catch((): Workspace[] => []);
    if (list.length > 0) {
      setWorkspaces(list);
      setCurrentPath(list.find((w) => w.id === id)?.path ?? list[0]?.path);
    }
  }, []);

  const handleAddWorkspace = useCallback(async (path: string) => {
    await addWorkspace({ id: path, name: workspaceName(path), path });
    await setCurrentWorkspace(path);
    const list = await getWorkspaces().catch((): Workspace[] => []);
    if (list.length > 0) {
      setWorkspaces(list);
      setCurrentPath(path);
    }
  }, []);

  return (
    <WindowProvider id="main">
      <RegistryProvider>
        {/* NOTE: react-native-macos never initializes Dimensions (no
            didUpdateDimensions anywhere in the fork), so Dimensions.get('window')
            throws "No dimension set" — all pane sizes are explicit state, never
            measured. */}
        <View className="flex-1 flex-row bg-background">
        <View style={{ width: navWidth, overflow: "hidden" }}>
          <Sidebar
            currentPath={currentPath}
            currentTab={nav}
            onAddWorkspace={(path) => void handleAddWorkspace(path)}
            onSelectWorkspace={(id) => void handleSelectWorkspace(id)}
            onTab={setNav}
            skillsCount={skills.length}
            workspaces={workspaces}
          />
        </View>
        <ResizeHandle
          onDrag={(dx) => {
            const next = Math.min(360, Math.max(200, navDragAnchor.current + dx));
            navWidthRef.current = next;
            setNavWidth(next);
          }}
          onDragStart={() => {
            navDragAnchor.current = navWidthRef.current;
          }}
        />
        {nav === "skills" ? (
          <>
            <View className="bg-surface" style={{ width: listWidth, overflow: "hidden" }}>
              <SkillList
                isCheckingUpdates={isCheckingUpdates}
                isLoading={isLoading}
                onCheckUpdates={() => void handleCheckUpdates()}
                onNewSkill={() => {
                  setInstallError(null);
                  setNewSkillOpen(true);
                }}
                onRescan={() => void refreshSkills()}
                onSelect={setSelectedId}
                selectedId={selectedId}
                skills={skillListItems}
              />
            </View>
            <ResizeHandle
              onDrag={(dx) => {
                const next = Math.min(560, Math.max(220, dragAnchor.current + dx));
                listWidthRef.current = next;
                setListWidth(next);
              }}
              onDragStart={() => {
                dragAnchor.current = listWidthRef.current;
              }}
            />
            <View className="min-w-0 flex-1 bg-background">
              <SkillDetail
                key={selectedSkill?.id ?? "none"}
                onInstallSkill={handleInstallSkill}
                onToggleInRepo={handleToggle}
                onUninstallSkill={handleUninstallSkill}
                onUpdateSkill={handleUpdateSkill}
                skill={selectedSkill}
                workspaces={workspaces}
              />
            </View>
          </>
        ) : nav === "discover" ? (
          <View className="min-w-0 flex-1">
            <DiscoverTab installedSkills={skills} onInstall={handleInstallSkill} />
          </View>
        ) : nav === "agents" ? (
          <View className="min-w-0 flex-1">
            <AgentsTab />
          </View>
        ) : (
          <View className="min-w-0 flex-1">
            <SettingsTab />
          </View>
        )}
      </View>
      {newSkillOpen ? (
        <InstallSkillDialog
          error={installError}
          onClose={() => {
            setNewSkillOpen(false);
            setInstallError(null);
          }}
          onInstall={(source, skillName) =>
            handleInstallSkill(source, skillName).then(
              () => {
                setNewSkillOpen(false);
                setInstallError(null);
              },
              (cause: unknown) => {
                setInstallError(cause instanceof Error ? cause.message : "Install failed.");
              },
            )}
        />
      ) : null}
      </RegistryProvider>
    </WindowProvider>
  );
}
