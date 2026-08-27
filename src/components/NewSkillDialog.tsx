import React, { useState } from "react";
import { Plus, X, GitBranch, Folder } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card.tsx";

interface NewSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: (source: string, skillName?: string) => Promise<void>;
}

export function NewSkillDialog({ isOpen, onClose, onInstall }: NewSkillDialogProps) {
  const [source, setSource] = useState("");
  const [skillName, setSkillName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onInstall(source.trim(), skillName.trim() || undefined);
      setSource("");
      setSkillName("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to install skill");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-md bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <Plus weight="light" className="w-4 h-4 text-primary" />
                Add New Skill
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-zinc-600 dark:text-zinc-400">
                Install a custom skill from GitHub or import a local directory.
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X weight="light" className="w-4 h-4" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                <GitBranch weight="light" className="w-3.5 h-3.5 text-primary" />
                GitHub Repository or Local Path
              </label>
              <Input
                placeholder="e.g. vercel-labs/skills or /path/to/skill"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
              <p className="text-[10px] text-zinc-500">
                Supports GitHub shorthand (`owner/repo`), GitHub URLs, or absolute local paths.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                <Folder weight="light" className="w-3.5 h-3.5 text-sky-500" />
                Custom Skill Name (Optional)
              </label>
              <Input
                placeholder="Leave blank to use repository name"
                value={skillName}
                onChange={(e) => setSkillName(e.target.value)}
                className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 pt-2.5 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-950/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading || !source.trim()} className="text-xs">
              {loading ? "Installing..." : "Install Skill"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
