import { SidebarSplitView } from "@legend-apps/appkit-split-view";
import { WindowProvider } from "@legend-apps/windows";
import { useCallback, useState } from "react";
import { Sidebar } from "./Sidebar";
import { SkillDetail } from "./SkillDetail";
import { toggleSkill, type Skill } from "./services/skills";
import type { Workspace } from "./services/workspaces";

// Single main window (global constraint: no multi-window at MVP). Task 6
// wires the detail pane to SkillDetail: selection resolves to the loaded
// Skill (lifted from Sidebar via `onSkills`), toggles go through the Task 3
// `toggleSkill` service. Install/uninstall execution is Task 7 (needs
// `downloadSkill` + a delete API that the skills-fs surface does not have
// yet), so those callbacks stay unwired and their buttons stay hidden.
export function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [skills, setSkills] = useState<Skill[]>([]);
  const selectedSkill = skills.find((s) => s.id === selectedId) ?? null;

  const handleToggle = useCallback(
    async (workspace: Workspace, enable: boolean): Promise<boolean> => {
      const skill = skills.find((s) => s.id === selectedId) ?? null;
      if (!skill) return false;
      return toggleSkill({
        skillSlug: skill.slug,
        sourcePath: skill.path,
        workspacePath: workspace.path,
        agent: skill.agent,
        enable,
      });
    },
    [skills, selectedId],
  );

  return (
    <WindowProvider id="main">
      <SidebarSplitView contentMinWidth={320} sidebarMinWidth={220} sidebarWidth={280}>
        <Sidebar onSelect={setSelectedId} onSkills={setSkills} selectedId={selectedId} />
        <SkillDetail
          key={selectedSkill?.id ?? "none"}
          onToggleInRepo={handleToggle}
          skill={selectedSkill}
        />
      </SidebarSplitView>
    </WindowProvider>
  );
}
