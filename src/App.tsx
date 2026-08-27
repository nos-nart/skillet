import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, NavTab } from "./components/Sidebar.tsx";
import { SkillList } from "./components/SkillList.tsx";
import { SkillDetail } from "./components/SkillDetail.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { api } from "./client/apiClient.ts";
import { Skill, Workspace } from "./types/skills.ts";
import { Bot, Terminal, Settings } from "lucide-react";

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
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
    } catch (err) {
      console.error("Toggle failed:", err);
    }
  };

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    try {
      await api.checkForUpdates();
      await loadSkills();
    } catch (err) {
      console.error("Update check failed:", err);
    } finally {
      setIsCheckingUpdates(false);
    }
  };

  const handleUpdateSkill = async (skill: Skill) => {
    try {
      await api.installSkill({ source: skill.packageName, skillName: skill.slug });
      await loadSkills();
    } catch (err) {
      console.error("Skill update failed:", err);
    }
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
            isLoading={isLoading}
            isCheckingUpdates={isCheckingUpdates}
          />
          <SkillDetail
            skill={selectedSkill}
            workspaces={workspaces}
            selectedWorkspace={selectedWorkspace}
            onToggleInRepo={handleToggle}
            onUpdateSkill={handleUpdateSkill}
          />
        </>
      )}

      {currentTab === "agents" && (
        <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Bot className="w-5 h-5 text-sky-400" />
                Detected Coding Agents
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Active AI coding agents and their standard skill discovery locations on your system.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "Cursor", path: "~/.cursor/skills", status: "Active", icon: "⚡" },
                { name: "Claude Code", path: "~/.claude/skills", status: "Active", icon: "🧠" },
                { name: "Gemini / Antigravity", path: "~/.gemini/config/skills", status: "Active", icon: "✨" },
                { name: "Generic Open Skills", path: "~/.skills", status: "Active", icon: "📦" },
                { name: "Windsurf", path: "~/.codeium/windsurf/skills", status: "Ready", icon: "🌊" },
                { name: "OpenCode", path: "~/.opencode/skills", status: "Ready", icon: "🔓" },
              ].map((agent) => (
                <div key={agent.name} className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{agent.icon}</span>
                      <span className="text-sm font-semibold text-zinc-200">{agent.name}</span>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {agent.status}
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 truncate">{agent.path}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {currentTab === "prompts" && (
        <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
          <div className="max-w-3xl space-y-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                Prompt & Trigger Catalog
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                All slash commands and triggers defined across your installed skills.
              </p>
            </div>

            <div className="space-y-2">
              {skills.map((skill) => (
                <div key={skill.id} className="p-3 bg-zinc-900/40 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-orange-400 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 font-semibold">
                      {skill.metadata.trigger || `/${skill.slug}`}
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">{skill.name}</span>
                      <span className="text-[11px] text-zinc-500 ml-2">{skill.metadata.description}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-600">{skill.packageName}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      )}

      {currentTab === "settings" && (
        <main className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <Settings className="w-5 h-5 text-zinc-400" />
                Settings & Preferences
              </h2>
              <p className="text-xs text-zinc-500 mt-1">
                Configure GitHub API tokens, discovery directories, and auto-update intervals.
              </p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">GitHub API Token (Optional)</label>
                <p className="text-[11px] text-zinc-500">Increases rate limits for discovering remote skills and private repositories.</p>
                <input
                  type="password"
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
              </div>

              <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">Application Version</label>
                <p className="text-[11px] text-zinc-500">Skillet v1.0.0 (Deno Desktop Runtime)</p>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
