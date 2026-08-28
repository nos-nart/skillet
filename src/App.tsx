import React, { useEffect, useCallback, useReducer, startTransition } from "react";
import { Sidebar, NavTab } from "./components/Sidebar.tsx";
import { SkillList } from "./components/SkillList.tsx";
import { SkillDetail } from "./components/SkillDetail.tsx";
import { AgentsTab } from "./components/tabs/AgentsTab.tsx";
import { DiscoverTab } from "./components/tabs/DiscoverTab.tsx";
import { PromptsTab } from "./components/tabs/PromptsTab.tsx";
import { SettingsTab } from "./components/tabs/SettingsTab.tsx";
import { NewSkillDialog } from "./components/NewSkillDialog.tsx";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "./components/ui/resizable.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { useTheme } from "./hooks/useTheme.ts";
import { useMediaQuery } from "./hooks/useMediaQuery.ts";
import { api } from "./client/apiClient.ts";
import { Skill, Workspace } from "./types/skills.ts";

interface AppState {
  currentTab: NavTab;
  skills: Skill[];
  selectedSkill: Skill | null;
  isLoading: boolean;
  isCheckingUpdates: boolean;
  isNewSkillOpen: boolean;
  mobileView: "sidebar" | "list" | "detail";
}

type AppAction =
  | { type: "SET_TAB"; payload: NavTab }
  | { type: "SET_MOBILE_VIEW"; payload: "sidebar" | "list" | "detail" }
  | { type: "LOAD_SKILLS_START" }
  | { type: "LOAD_SKILLS_SUCCESS"; payload: { skills: Skill[], deletedIds: Set<string> } }
  | { type: "LOAD_SKILLS_ERROR" }
  | { type: "SELECT_SKILL"; payload: Skill | null }
  | { type: "UNINSTALL_SKILL"; payload: string }
  | { type: "SET_CHECKING_UPDATES"; payload: boolean }
  | { type: "SET_NEW_SKILL_OPEN"; payload: boolean };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_TAB":
      return { 
        ...state, 
        currentTab: action.payload,
        mobileView: action.payload === "skills" ? (state.selectedSkill ? "detail" : "list") : state.mobileView
      };
    case "SET_MOBILE_VIEW":
      return { ...state, mobileView: action.payload };
    case "LOAD_SKILLS_START":
      return { ...state, isLoading: true };
    case "LOAD_SKILLS_SUCCESS": {
      const { skills: newSkills, deletedIds } = action.payload;
      const filtered = newSkills.filter(s => !deletedIds.has(s.id));
      
      let nextSelected = state.selectedSkill;
      if (nextSelected && deletedIds.has(nextSelected.id)) nextSelected = filtered[0] ?? null;
      else if (!nextSelected) nextSelected = filtered[0] ?? null;
      else {
        nextSelected = filtered.find(s => s.id === nextSelected!.id || s.path === nextSelected!.path) || filtered[0] || null;
      }
      
      return { ...state, isLoading: false, skills: filtered, selectedSkill: nextSelected };
    }
    case "LOAD_SKILLS_ERROR":
      return { ...state, isLoading: false };
    case "SELECT_SKILL":
      return { ...state, selectedSkill: action.payload, mobileView: action.payload ? "detail" : state.mobileView };
    case "UNINSTALL_SKILL": {
      const removedId = action.payload;
      const nextSkills = state.skills.filter(s => s.id !== removedId);
      const nextSelected = state.selectedSkill?.id === removedId ? null : state.selectedSkill;
      return { ...state, skills: nextSkills, selectedSkill: nextSelected, mobileView: nextSelected ? state.mobileView : "list" };
    }
    case "SET_CHECKING_UPDATES":
      return { ...state, isCheckingUpdates: action.payload };
    case "SET_NEW_SKILL_OPEN":
      return { ...state, isNewSkillOpen: action.payload };
    default:
      return state;
  }
}

const initialAppState: AppState = {
  currentTab: "skills",
  skills: [],
  selectedSkill: null,
  isLoading: false,
  isCheckingUpdates: false,
  isNewSkillOpen: false,
  mobileView: "sidebar"
};

export function App() {
  const [state, dispatch] = useReducer(appReducer, initialAppState);
  
  const { theme, toggleTheme } = useTheme();
  const { workspaces, selectedWorkspace, setSelectedWorkspace, addWorkspace } = useWorkspaces();
  const deletedSkillIds = React.useRef<Set<string>>(new Set());
  const isMobile = useMediaQuery("(max-width: 950px)");

  const handleSelectSkill = useCallback((s: Skill | null) => {
    startTransition(() => dispatch({ type: "SELECT_SKILL", payload: s }));
  }, []);

  const loadSkills = useCallback(async () => {
    dispatch({ type: "LOAD_SKILLS_START" });
    try {
      const raw = await api.getSkills();
      dispatch({ type: "LOAD_SKILLS_SUCCESS", payload: { skills: raw, deletedIds: deletedSkillIds.current } });
    } catch (err) {
      console.error("Failed to load skills:", err);
      dispatch({ type: "LOAD_SKILLS_ERROR" });
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleToggle = async (ws: Workspace, enable: boolean) => {
    if (!state.selectedSkill) return;
    try {
      await api.toggleSkill({
        skillSlug: state.selectedSkill.slug,
        sourcePath: state.selectedSkill.path,
        workspacePath: ws.path,
        agent: state.selectedSkill.agent,
        enable,
      });
      await loadSkills();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleCheckUpdates = async () => {
    dispatch({ type: "SET_CHECKING_UPDATES", payload: true });
    try {
      const token = localStorage.getItem("github_token") || undefined;
      await api.checkUpdates(state.skills, token);
      await loadSkills();
    } catch (err) {
      console.error("Update check failed:", err);
    } finally {
      dispatch({ type: "SET_CHECKING_UPDATES", payload: false });
    }
  };

  const handleUpdateSkill = async (skill: Skill) => {
    try {
      const token = localStorage.getItem("github_token") || undefined;
      await api.installSkill({ source: skill.packageName, skillName: skill.slug, token });
      await loadSkills();
    } catch (err) {
      console.error("Skill update failed:", err);
    }
  };

  const handleUninstallSkill = async (skill: Skill) => {
    deletedSkillIds.current.add(skill.id);
    dispatch({ type: "UNINSTALL_SKILL", payload: skill.id });

    try {
      const res = await api.uninstallSkill(skill.path);
      if (!res.ok) console.error("Uninstall failed:", res.error);
    } catch (err) {
      console.error("Uninstall failed:", err);
    }

    await new Promise((r) => setTimeout(r, 300));
    await loadSkills();
    deletedSkillIds.current.delete(skill.id);
  };


  const handleCreateNewSkill = async (name: string, content: string) => {
    const result = await api.createSkill(name, content);
    if (!result.ok) {
      throw new Error(result.error || "Creation failed");
    }
    await loadSkills();
  };

  const handleInstallNewSkill = async (source: string, skillName?: string) => {
    const token = localStorage.getItem("github_token") || undefined;
    const result = await api.installSkill({ source, skillName, token });
    if (!result.ok) {
      throw new Error(result.error || "Installation failed");
    }
    await loadSkills();
  };

  if (isMobile) {
    return (
      <div className={`h-screen w-screen overflow-hidden font-sans ${theme === "light" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-zinc-100"}`}>
        {state.mobileView === "sidebar" && (
          <div className="h-full w-full animate-in slide-in-from-left-4 fade-in duration-300">
            <Sidebar
              currentTab={state.currentTab}
              setCurrentTab={(t) => dispatch({ type: "SET_TAB", payload: t })}
              skillsCount={state.skills.length}
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onSelectWorkspace={setSelectedWorkspace}
              onAddWorkspace={addWorkspace}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </div>
        )}
        {state.mobileView === "list" && state.currentTab === "skills" && (
          <div className="h-full w-full animate-in slide-in-from-right-4 fade-in duration-300 relative">
            <div className="absolute top-2 right-2 z-50">
              <button onClick={() => dispatch({ type: "SET_MOBILE_VIEW", payload: "sidebar" })} className="px-3 py-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-95 transition-transform text-zinc-900 dark:text-zinc-100">Done</button>
            </div>
            <SkillList
              skills={state.skills}
              selectedSkill={state.selectedSkill}
              onSelectSkill={handleSelectSkill}
              onCheckUpdates={handleCheckUpdates}
              onRescan={loadSkills}
              onNewSkill={() => dispatch({ type: "SET_NEW_SKILL_OPEN", payload: true })}
              isLoading={state.isLoading}
              isCheckingUpdates={state.isCheckingUpdates}
            />
          </div>
        )}
        {state.mobileView === "detail" && state.currentTab === "skills" && (
          <div className="h-full w-full animate-in slide-in-from-bottom-4 fade-in duration-300 relative">
             <div className="absolute top-2 left-2 z-50">
              <button onClick={() => startTransition(() => dispatch({ type: "SELECT_SKILL", payload: null }))} className="px-3 py-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-95 transition-transform text-zinc-900 dark:text-zinc-100">← Back</button>
            </div>
            <SkillDetail
              skill={state.selectedSkill}
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onToggleInRepo={handleToggle}
              onUpdateSkill={handleUpdateSkill}
              onUninstallSkill={handleUninstallSkill}
            />
          </div>
        )}
        {state.currentTab !== "skills" && state.mobileView !== "sidebar" && (
          <div className="h-full w-full animate-in slide-in-from-right-4 fade-in duration-300 relative">
             <div className="absolute top-2 left-2 z-50">
              <button onClick={() => dispatch({ type: "SET_MOBILE_VIEW", payload: "sidebar" })} className="px-3 py-1 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 shadow-sm active:scale-95 transition-transform text-zinc-900 dark:text-zinc-100">← Menu</button>
            </div>
            {state.currentTab === "discover" && <DiscoverTab installedSkills={state.skills} onInstall={handleInstallNewSkill}
        onCreate={handleCreateNewSkill} />}
            {state.currentTab === "agents" && <AgentsTab />}
            {state.currentTab === "prompts" && <PromptsTab skills={state.skills} />}
            {state.currentTab === "settings" && <SettingsTab />}
          </div>
        )}
        <NewSkillDialog
          isOpen={state.isNewSkillOpen}
          onClose={() => dispatch({ type: "SET_NEW_SKILL_OPEN", payload: false })}
          onInstall={handleInstallNewSkill}
          onCreate={handleCreateNewSkill}
        />
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen flex flex-row overflow-hidden font-sans ${theme === "light" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-zinc-100"}`}>
      {state.currentTab === "skills" ? (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
            <Sidebar
              currentTab={state.currentTab}
              setCurrentTab={(t) => dispatch({ type: "SET_TAB", payload: t })}
              skillsCount={state.skills.length}
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onSelectWorkspace={setSelectedWorkspace}
              onAddWorkspace={addWorkspace}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={27} minSize={20} maxSize={40}>
            <SkillList
              skills={state.skills}
              selectedSkill={state.selectedSkill}
              onSelectSkill={handleSelectSkill}
              onCheckUpdates={handleCheckUpdates}
              onRescan={loadSkills}
              onNewSkill={() => dispatch({ type: "SET_NEW_SKILL_OPEN", payload: true })}
              isLoading={state.isLoading}
              isCheckingUpdates={state.isCheckingUpdates}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={30}>
            <SkillDetail
              skill={state.selectedSkill}
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onToggleInRepo={handleToggle}
              onUpdateSkill={handleUpdateSkill}
              onUninstallSkill={handleUninstallSkill}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
            <Sidebar
              currentTab={state.currentTab}
              setCurrentTab={(t) => dispatch({ type: "SET_TAB", payload: t })}
              skillsCount={state.skills.length}
              workspaces={workspaces}
              selectedWorkspace={selectedWorkspace}
              onSelectWorkspace={setSelectedWorkspace}
              onAddWorkspace={addWorkspace}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={82} minSize={40}>
            {state.currentTab === "discover" && <DiscoverTab installedSkills={state.skills} onInstall={handleInstallNewSkill} />}
            {state.currentTab === "agents" && <AgentsTab />}
            {state.currentTab === "prompts" && <PromptsTab skills={state.skills} />}
            {state.currentTab === "settings" && <SettingsTab />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <NewSkillDialog
        isOpen={state.isNewSkillOpen}
        onClose={() => dispatch({ type: "SET_NEW_SKILL_OPEN", payload: false })}
        onInstall={handleInstallNewSkill}
        onCreate={handleCreateNewSkill}
      />
    </div>
  );
}
