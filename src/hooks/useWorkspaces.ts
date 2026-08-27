import { useState, useEffect } from "react";
import { Workspace } from "../types/skills.ts";
import { api } from "../client/apiClient.ts";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "global", name: "Global Scope", path: "~/.skills", isCurrent: true },
  ]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(workspaces[0]);
  const [isLoading, setIsLoading] = useState(false);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const list = await api.getWorkspaces();
      if (list && list.length > 0) {
        setWorkspaces(list);
        if (!selectedWorkspace || !list.some((w) => w.id === selectedWorkspace.id)) {
          setSelectedWorkspace(list[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load workspaces:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addWorkspace = async (ws: Workspace) => {
    try {
      const ok = await api.addWorkspace(ws);
      if (ok) {
        await loadWorkspaces();
      }
    } catch (err) {
      console.error("Failed to add workspace:", err);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  return {
    workspaces,
    selectedWorkspace,
    setSelectedWorkspace,
    addWorkspace,
    refreshWorkspaces: loadWorkspaces,
    isLoading,
  };
}
