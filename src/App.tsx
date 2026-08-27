import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/Sidebar.tsx";
import { SkillList } from "./components/SkillList.tsx";
import { SkillDetail } from "./components/SkillDetail.tsx";
import { AgentsTab } from "./components/tabs/AgentsTab.tsx";
import { PromptsTab } from "./components/tabs/PromptsTab.tsx";
import { SettingsTab } from "./components/tabs/SettingsTab.tsx";
import { NewSkillDialog } from "./components/NewSkillDialog.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { api } from "./client/apiClient.ts";
import { Skill, Workspace } from "./types/skills.ts";

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const [isNewSkillOpen, setIsNewSkillOpen] = useState(false);
  const { workspaces, selectedWorkspace, setSelectedWorkspace, addWorkspace } = useWorkspaces();

  const loadSkills = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getSkills();
      setSkills(data);
      if (data.length > 0) {
        setSelectedSkill((prev) => {
          if (!prev) return data[0];
          const match = data.find((s) => s.id === prev.id);
          return match || data[0];
        });
      } else {
        setSelectedSkill(null);
      }
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
    try {
      await api.uninstallSkill(skill.path);
      await loadSkills();
    } catch (err) {
      console.error("Uninstall failed:", err);
    }
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
    <div className="h-screen w-screen flex flex-row overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        skillsCount={skills.length}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={setSelectedWorkspace}
        onAddWorkspace={addWorkspace}
      />

      {currentTab === "skills" && (
        <>
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
          <SkillDetail
            skill={selectedSkill}
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            onToggleInRepo={handleToggle}
            onUpdateSkill={handleUpdateSkill}
            onUninstallSkill={handleUninstallSkill}
          />
        </>
      )}

      {currentTab === "agents" && <AgentsTab />}

      {currentTab === "prompts" && <PromptsTab skills={skills} />}

      {currentTab === "settings" && <SettingsTab />}

      <NewSkillDialog
        isOpen={isNewSkillOpen}
        onClose={() => setIsNewSkillOpen(false)}
        onInstall={handleInstallNewSkill}
      />
    </div>
  );
}
