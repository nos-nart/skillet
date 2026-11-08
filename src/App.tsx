import { setWindowOptions } from "@legendapp/spark/windows";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import * as Cause from "effect/Cause";
import * as Effect from "effect/Effect";
import { RegistryProvider, useAtom } from "@effect/atom-react";
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
  toggleSkillEffect,
  uninstallSkillEffect,
  type DownloadSkillInput,
  type Skill,
} from "./services/skills";
import { getGithubToken } from "./services/settings";
import { hydrateStorage } from "./services/storage";
import { checkSkillUpdates, updateSkill } from "./services/updater";
import { applyStoredTheme, themePalette, useAppTheme } from "./services/theme";
import {
  addWorkspace,
  setCurrentWorkspace,
  type Workspace,
} from "./services/workspaces";
import { fetchSkillsAtom } from "./services/skillsAtoms";
import {
  currentWorkspacePathAtom,
  fetchWorkspacesAtom,
} from "./services/workspacesAtoms";
import { FsError } from "./services/errors";

applyStoredTheme();

const EMPTY_SKILLS: Skill[] = [];
const EMPTY_WORKSPACES: Workspace[] = [];

function formatFsError(cause: Cause.Cause<unknown>): string {
  const error = Cause.squash(cause);
  if (error instanceof FsError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Filesystem operation failed.";
}

function AppContent(): React.JSX.Element {
  const theme = useAppTheme();
  const [nav, setNav] = useState<SidebarNav>("skills");
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [currentPath, setCurrentPath] = useAtom(currentWorkspacePathAtom);
  const [loadSkillsResult, runFetchSkills] = useAtom(fetchSkillsAtom);
  const [loadWorkspacesResult, runFetchWorkspaces] = useAtom(fetchWorkspacesAtom);
  const [dismissedSkillsError, setDismissedSkillsError] = useState(false);
  const [dismissedWorkspacesError, setDismissedWorkspacesError] = useState(false);
  const [updatesMap, setUpdatesMap] = useState<Record<string, boolean>>({});
  const [updatesError, setUpdatesError] = useState<string | null>(null);
  const [workspaceActionError, setWorkspaceActionError] = useState<string | null>(null);

  const skills = loadSkillsResult._tag === "Success" ? loadSkillsResult.value : EMPTY_SKILLS;
  const workspaces = loadWorkspacesResult._tag === "Success" ? loadWorkspacesResult.value : EMPTY_WORKSPACES;

  const skillsError =
    !dismissedSkillsError && loadSkillsResult._tag === "Failure"
      ? formatFsError(loadSkillsResult.cause)
      : null;
  const workspacesLoadError =
    !dismissedWorkspacesError && loadWorkspacesResult._tag === "Failure"
      ? formatFsError(loadWorkspacesResult.cause)
      : null;
  const workspacesError = workspacesLoadError ?? workspaceActionError;
  const displayedSkillsError = skillsError ?? updatesError;

  const isLoading = loadSkillsResult.waiting;
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [newSkillOpen, setNewSkillOpen] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [listWidth, setListWidth] = useState(300);
  const listWidthRef = useRef(300);
  const dragAnchor = useRef(300);
  const [navWidth, setNavWidth] = useState(240);
  const navWidthRef = useRef(240);
  const navDragAnchor = useRef(240);

  const selectedSkill = useMemo(() => {
    const s = skills.find((skill) => skill.id === selectedId);
    if (!s) return null;
    return {
      ...s,
      updateAvailable: updatesMap[s.packageName] ?? s.updateAvailable,
    };
  }, [skills, selectedId, updatesMap]);

  const skillListItems = useMemo(
    () =>
      skills.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        packageName: s.packageName,
        trigger: s.metadata.trigger ?? `/${s.slug}`,
        description: s.metadata.description || s.name,
        updateAvailable: updatesMap[s.packageName] ?? s.updateAvailable,
      })),
    [skills, updatesMap],
  );

  useEffect(() => {
    if (skills.length > 0) {
      setSelectedId((prev) => {
        if (prev && skills.some((s) => s.id === prev)) return prev;
        return skills[0]?.id;
      });
    }
  }, [skills]);

  useEffect(() => {
    if (workspaces.length > 0) {
      setCurrentPath((prev) =>
        prev && workspaces.some((w) => w.path === prev)
          ? prev
          : (workspaces.find((w) => w.isCurrent)?.path ?? workspaces[0]?.path),
      );
    }
  }, [workspaces, setCurrentPath]);

  const refreshSkills = useCallback(() => {
    setDismissedSkillsError(false);
    runFetchSkills(undefined);
  }, [runFetchSkills]);

  const refreshWorkspaces = useCallback(() => {
    setDismissedWorkspacesError(false);
    runFetchWorkspaces(undefined);
  }, [runFetchWorkspaces]);

  useEffect(() => {
    void hydrateStorage().then(() => {
      applyStoredTheme();
      refreshSkills();
      refreshWorkspaces();
    });
  }, [refreshSkills, refreshWorkspaces]);

  useEffect(() => {
    void setWindowOptions("main", {
      appearance: theme,
      backgroundColor: themePalette(theme).background,
    }).catch(() => {});
  }, [theme]);

  const handleToggle = useCallback(
    async (workspace: Workspace, enable: boolean): Promise<boolean> => {
      const skill = skills.find((s) => s.id === selectedId) ?? null;
      if (!skill) return false;
      return Effect.runPromise(
        toggleSkillEffect({
          skillSlug: skill.slug,
          sourcePath: skill.path,
          workspacePath: workspace.path,
          enable,
        }),
      );
    },
    [skills, selectedId],
  );

  const handleInstallSkill = useCallback(
    async (input: DownloadSkillInput): Promise<void> => {
      const res = await downloadSkill(input);
      if (!res.ok) throw new Error(res.error);
      refreshSkills();
    },
    [refreshSkills],
  );

  const handleInstallFromDiscover = useCallback(
    async (source: string): Promise<void> => {
      await handleInstallSkill({ source });
    },
    [handleInstallSkill],
  );

  const handleCheckUpdates = useCallback(async (): Promise<void> => {
    setIsCheckingUpdates(true);
    setUpdatesError(null);
    try {
      const token = getGithubToken();
      const map = await checkSkillUpdates(skills, { token });
      setUpdatesMap(map);
    } catch (cause: unknown) {
      setUpdatesError(cause instanceof Error ? cause.message : "Failed to check for skill updates.");
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [skills]);

  const handleUpdateSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      await updateSkill(skill, { token: getGithubToken() });
      refreshSkills();
    },
    [refreshSkills],
  );

  const handleUninstallSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      await Effect.runPromise(
        uninstallSkillEffect({
          skillPath: skill.path,
          skillSlug: skill.slug,
          workspacePaths: workspaces.map((w) => w.path),
        }),
      );
      if (selectedId === skill.id) setSelectedId(undefined);
      refreshSkills();
    },
    [refreshSkills, selectedId, workspaces],
  );

  const handleSelectWorkspace = useCallback(
    async (id: string) => {
      try {
        setWorkspaceActionError(null);
        await setCurrentWorkspace(id);
        refreshWorkspaces();
      } catch (cause: unknown) {
        setWorkspaceActionError(cause instanceof Error ? cause.message : "Failed to select workspace.");
      }
    },
    [refreshWorkspaces],
  );

  const handleAddWorkspace = useCallback(
    async (path: string) => {
      try {
        setWorkspaceActionError(null);
        await addWorkspace({ id: path, name: workspaceName(path), path });
        await setCurrentWorkspace(path);
        refreshWorkspaces();
      } catch (cause: unknown) {
        setWorkspaceActionError(cause instanceof Error ? cause.message : "Failed to add workspace.");
      }
    },
    [refreshWorkspaces],
  );

  const handleDismissSkillsError = useCallback(() => {
    setDismissedSkillsError(true);
    setUpdatesError(null);
  }, []);

  return (
    <View className="flex-1 bg-background">
      <View className="flex-1 flex-row">
        <View style={{ width: navWidth, overflow: "hidden" }}>
          <Sidebar
            currentPath={currentPath}
            currentTab={nav}
            error={workspacesError}
            onAddWorkspace={handleAddWorkspace}
            onDismissError={() => {
              setDismissedWorkspacesError(true);
              setWorkspaceActionError(null);
            }}
            onSelectWorkspace={handleSelectWorkspace}
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
                error={displayedSkillsError}
                isCheckingUpdates={isCheckingUpdates}
                isLoading={isLoading}
                onCheckUpdates={() => void handleCheckUpdates()}
                onDismissError={handleDismissSkillsError}
                onNewSkill={() => {
                  setInstallError(null);
                  setNewSkillOpen(true);
                }}
                onRescan={refreshSkills}
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
            <DiscoverTab installedSkills={skills} onInstall={handleInstallFromDiscover} />
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
          installedSlugs={skills.map((s) => s.slug)}
          workspaces={workspaces}
          onClose={() => {
            setNewSkillOpen(false);
            setInstallError(null);
          }}
          onInstall={(input) =>
            handleInstallSkill(input).catch((cause: unknown) => {
              const message = cause instanceof Error ? cause.message : "Install failed.";
              setInstallError(message);
              throw cause;
            })}
        />
      ) : null}
    </View>
  );
}

export function App(): React.JSX.Element {
  return (
    <RegistryProvider>
      <AppContent />
    </RegistryProvider>
  );
}
