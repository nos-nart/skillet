import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/Sidebar.tsx";
import { SkillList } from "./components/SkillList.tsx";
import { SkillDetail } from "./components/SkillDetail.tsx";
import { AgentsTab } from "./components/tabs/AgentsTab.tsx";
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
import { api } from "./client/apiClient.ts";
import { Skill, Workspace } from "./types/skills.ts";

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isNewSkillOpen, setIsNewSkillOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { workspaces, selectedWorkspace, setSelectedWorkspace, addWorkspace } = useWorkspaces();

  // Track skill IDs that were just uninstalled so loadSkills won't re-select them
  const deletedSkillIds = React.useRef<Set<string>>(new Set());

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const raw = await api.getSkills();
      // Filter out any skills that were just uninstalled (filesystem may lag)
      const data = raw.filter((s) => !deletedSkillIds.current.has(s.id));
      setSkills(data);
      setSelectedSkill((prev) => {
        if (prev && deletedSkillIds.current.has(prev.id)) return data[0] ?? null;
        if (!prev) return data[0] ?? null;
        const match = data.find((s) => s.id === prev.id || s.path === prev.path);
        return match || data[0] || null;
      });
    } catch (err) {
      console.error("Failed to load skills:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const handleToggle = async (ws: Workspace, enable: boolean) => {
    if (!selectedSkill) return;
    try {
      await api.toggleSkill({
        skillSlug: selectedSkill.slug,
        sourcePath: selectedSkill.path,
        workspacePath: ws.path,
        agent: selectedSkill.agent,
        enable,
      });
      await loadSkills();
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      const token = localStorage.getItem("github_token") || undefined;
      await api.checkUpdates(skills, token);
      await loadSkills();
    } catch (err) {
      console.error("Update check failed:", err);
    } finally {
      setIsCheckingUpdates(false);
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
    // Optimistic removal: immediately remove from UI state
    const removedId = skill.id;
    const removedPath = skill.path;
    deletedSkillIds.current.add(removedId);

    setSkills((prev) => prev.filter((s) => s.id !== removedId));
    setSelectedSkill((prev) => {
      if (prev?.id === removedId) return null;
      return prev;
    });

    try {
      const res = await api.uninstallSkill(removedPath);
      if (!res.ok) {
        console.error("Uninstall failed:", res.error);
      }
    } catch (err) {
      console.error("Uninstall failed:", err);
    }

    // Small delay to let filesystem settle, then rescan to reconcile
    await new Promise((r) => setTimeout(r, 300));
    await loadSkills();
    deletedSkillIds.current.delete(removedId);
  };

  const handleInstallNewSkill = async (source: string, skillName?: string) => {
    const token = localStorage.getItem("github_token") || undefined;
    const result = await api.installSkill({ source, skillName, token });
    if (!result.ok) {
      throw new Error(result.error || "Installation failed");
    }
    await loadSkills();
  };

  return (
    <div className={`h-screen w-screen flex flex-row overflow-hidden font-sans ${theme === "light" ? "bg-zinc-100 text-zinc-900" : "bg-zinc-950 text-zinc-100"}`}>
      {currentTab === "skills" ? (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
            <Sidebar
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              skillsCount={skills.length}
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
              skills={skills}
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
              onCheckUpdates={handleCheckUpdates}
              onRescan={loadSkills}
              onNewSkill={() => setIsNewSkillOpen(true)}
              isLoading={isLoading}
              isCheckingUpdates={isCheckingUpdates}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={55} minSize={30}>
            <SkillDetail
              skill={selectedSkill}
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
              currentTab={currentTab}
              setCurrentTab={setCurrentTab}
              skillsCount={skills.length}
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
            {currentTab === "agents" && <AgentsTab />}
            {currentTab === "prompts" && <PromptsTab skills={skills} />}
            {currentTab === "settings" && <SettingsTab />}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      <NewSkillDialog
        isOpen={isNewSkillOpen}
        onClose={() => setIsNewSkillOpen(false)}
        onInstall={handleInstallNewSkill}
      />
    </div>
  );
}
