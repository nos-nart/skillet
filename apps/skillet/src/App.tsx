import { SidebarSplitView } from "@legend-apps/appkit-split-view";
import { WindowProvider } from "@legend-apps/windows";
import { useCallback, useState } from "react";
import { Sidebar } from "./Sidebar";
import { SkillDetail } from "./SkillDetail";
import {
  downloadSkill,
  getSkills,
  toggleSkill,
  uninstallSkill,
  type Skill,
} from "./services/skills";
import { getWorkspaces, type Workspace } from "./services/workspaces";

// Single main window (global constraint: no multi-window at MVP). Task 6
// wires the detail pane to SkillDetail: selection resolves to the loaded
// Skill (lifted from Sidebar via `onSkills`), toggles go through the Task 3
// `toggleSkill` service. Task 7 wires install/uninstall for real —
// `downloadSkill` (JS fetch + native write) and `uninstallSkill` (native
// delete + workspace-link sweep) — which unhides the Task 6 buttons.
export function App(): React.JSX.Element {
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [skills, setSkills] = useState<Skill[]>([]);
  const selectedSkill = skills.find((s) => s.id === selectedId) ?? null;

  const refreshSkills = useCallback(async (): Promise<void> => {
    try {
      setSkills(await getSkills());
    } catch {
      // Keep the last good list; Sidebar re-scans on its own cadence.
    }
  }, []);

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

  // Deletes the installed skill dir plus its workspace symlinks; workspace
  // paths come from the picker-stored absolute paths (symlink/unlink never
  // expand `~` — Task 3 precondition).
  const handleUninstallSkill = useCallback(
    async (skill: Skill): Promise<void> => {
      const workspaces = await getWorkspaces().catch((): Workspace[] => []);
      const ok = await uninstallSkill({
        skillPath: skill.path,
        skillSlug: skill.slug,
        workspacePaths: workspaces.map((w) => w.path),
      });
      if (!ok) throw new Error(`Could not uninstall ${skill.name}.`);
      if (selectedId === skill.id) setSelectedId(undefined);
      await refreshSkills();
    },
    [refreshSkills, selectedId],
  );

  return (
    <WindowProvider id="main">
      <SidebarSplitView contentMinWidth={320} sidebarMinWidth={220} sidebarWidth={280}>
        <Sidebar onSelect={setSelectedId} onSkills={setSkills} selectedId={selectedId} />
        <SkillDetail
          key={selectedSkill?.id ?? "none"}
          onInstallSkill={handleInstallSkill}
          onToggleInRepo={handleToggle}
          onUninstallSkill={handleUninstallSkill}
          skill={selectedSkill}
        />
      </SidebarSplitView>
    </WindowProvider>
  );
}
