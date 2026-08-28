import React, { useState } from "react";
import { PlusIcon, XIcon, GitBranchIcon, FolderIcon, FileTextIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card.tsx";

interface NewSkillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: (source: string, skillName?: string) => Promise<void>;
  onCreate: (name: string, content: string) => Promise<void>;
}

export function NewSkillDialog({ isOpen, onClose, onInstall, onCreate }: NewSkillDialogProps) {
  const [mode, setMode] = useState<"install" | "create">("install");
  
  const [source, setSource] = useState("");
  const [skillName, setSkillName] = useState("");
  const [markdownContent, setMarkdownContent] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isInstall = mode === "install";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError(null);
    try {
      if (isInstall) {
        if (!source.trim()) return;
        await onInstall(source.trim(), skillName.trim() || undefined);
      } else {
        if (!skillName.trim() || !markdownContent.trim()) return;
        await onCreate(skillName.trim(), markdownContent.trim());
      }
      
      setSource("");
      setSkillName("");
      setMarkdownContent("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process skill");
    } finally {
      setLoading(false);
    }
  };

  const getToggleClass = (btnMode: "install" | "create") => 
    `flex-1 text-center py-1.5 rounded-md font-medium transition-colors ${
      mode === btnMode 
        ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm" 
        : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
    }`;

  const isSubmitDisabled = loading || (isInstall ? !source.trim() : (!skillName.trim() || !markdownContent.trim()));
  const submitText = loading 
    ? (isInstall ? "Installing..." : "Creating...") 
    : (isInstall ? "Install Skill" : "Create Skill");

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <Card className="w-full max-w-lg bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden animate-in zoom-in-95 duration-150">
        <form onSubmit={handleSubmit}>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
                <PlusIcon weight="light" className="size-4 text-primary" />
                Add New Skill
              </CardTitle>
              <CardDescription className="text-xs mt-1 text-zinc-600 dark:text-zinc-400">
                {isInstall ? "Install a custom skill from GitHub or a local directory." : "Create a new skill manually by pasting Markdown."}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <XIcon weight="light" className="size-4" />
            </button>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {error && (
              <div className="p-2.5 rounded-lg bg-destructive-soft border border-destructive-border text-destructive-hover dark:text-destructive-light text-xs">
                {error}
              </div>
            )}
            
            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg">
              <button 
                type="button" 
                onClick={() => { setMode("install"); setError(null); }}
                className={getToggleClass("install")}
              >
                Import from GitHub
              </button>
              <button 
                type="button" 
                onClick={() => { setMode("create"); setError(null); }}
                className={getToggleClass("create")}
              >
                Create Manually
              </button>
            </div>

            {isInstall ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <GitBranchIcon weight="light" className="size-3.5 text-primary" />
                    GitHub Repository, Gist, or Local Path
                  </label>
                  <Input
                    placeholder="e.g. vercel-labs/skills, a Gist URL, or /path/to/skill"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                  <p className="text-xs text-zinc-500">
                    Supports GitHub shorthand (`owner/repo`), Gist URLs, or absolute local paths.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <FolderIcon weight="light" className="size-3.5 text-primary" />
                    Custom Skill Name (Optional)
                  </label>
                  <Input
                    placeholder="Leave blank to use repository name"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <FolderIcon weight="light" className="size-3.5 text-primary" />
                    Skill Name
                  </label>
                  <Input
                    placeholder="e.g. my-awesome-skill"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    required
                    className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-zinc-700 dark:text-zinc-300 font-semibold flex items-center gap-1.5">
                    <FileTextIcon weight="light" className="size-3.5 text-primary" />
                    SKILL.md Content
                  </label>
                  <textarea
                    placeholder="Paste your SKILL.md markdown content here..."
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    required
                    rows={8}
                    className="w-full resize-none p-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all text-xs font-mono"
                  />
                </div>
              </>
            )}
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
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitDisabled} 
              className="text-xs"
            >
              {submitText}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
