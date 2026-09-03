import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { PlusIcon, XIcon, GitBranchIcon, FolderIcon, FileTextIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card.tsx";
import { dialogStyles } from "./ui/dialogStyles.ts";
import { colors, iconSizes } from "../tokens.stylex.ts";

const styles = stylex.create({
  header: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.textPrimary,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  desc: {
    fontSize: 12,
    marginTop: 4,
    color: colors.textSecondary,
  },
  content: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    fontSize: 12,
  },
  error: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.destructiveSoft,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.destructiveBorder,
    color: colors.destructiveHover,
    fontSize: 12,
  },
  toggleRow: {
    display: "flex",
    backgroundColor: colors.bgSecondary,
    padding: 4,
    borderRadius: 8,
  },
  toggleBtn: {
    flex: 1,
    textAlign: "center",
    paddingTop: 6,
    paddingBottom: 6,
    borderRadius: 6,
    fontWeight: 500,
    transitionProperty: "color, background-color",
    transitionDuration: "150ms",
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    cursor: "pointer",
    fontSize: 12,
  },
  toggleActive: {
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
  },
  toggleInactive: {
    color: colors.textMuted,
    ":hover": {
      color: colors.textSecondary,
    },
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  label: {
    color: colors.textSecondary,
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.textMuted,
  },
  textarea: {
    width: "100%",
    resize: "none",
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    color: colors.textPrimary,
    fontSize: 12,
    fontFamily: "monospace",
    outline: "none",
    transitionProperty: "border-color, box-shadow",
    transitionDuration: "150ms",
    ":focus": {
      borderColor: colors.primaryBorder,
      boxShadow: `0 0 0 2px color-mix(in srgb, ${colors.primary} 20%, transparent)`,
    },
  },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 8,
    paddingTop: 10,
    borderTop: `1px solid ${colors.borderDefault}`,
    backgroundColor: colors.bgSecondary,
  },
});

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

  const isSubmitDisabled = loading || (isInstall ? !source.trim() : (!skillName.trim() || !markdownContent.trim()));
  const submitText = loading 
    ? (isInstall ? "Installing..." : "Creating...") 
    : (isInstall ? "Install Skill" : "Create Skill");

  return (
    <div {...stylex.props(dialogStyles.overlay)}>
      <Card {...stylex.props(dialogStyles.dialog)}>
        <form onSubmit={handleSubmit}>
          <CardHeader {...stylex.props(styles.header)}>
            <div>
              <CardTitle {...stylex.props(styles.title)}>
                <PlusIcon weight="light" style={{ ...iconSizes.md, color: colors.primary }} />
                Add New Skill
              </CardTitle>
              <CardDescription {...stylex.props(styles.desc)}>
                {isInstall ? "Install a custom skill from GitHub or a local directory." : "Create a new skill manually by pasting Markdown."}
              </CardDescription>
            </div>
            <button
              type="button"
              onClick={onClose}
              {...stylex.props(dialogStyles.closeBtn)}
            >
              <XIcon weight="light" style={iconSizes.md} />
            </button>
          </CardHeader>

          <CardContent {...stylex.props(styles.content)}>
            {error && (
              <div {...stylex.props(styles.error)}>{error}</div>
            )}
            
            <div {...stylex.props(styles.toggleRow)}>
              <button 
                type="button" 
                onClick={() => { setMode("install"); setError(null); }}
                {...stylex.props(styles.toggleBtn, mode === "install" ? styles.toggleActive : styles.toggleInactive)}
              >
                Import from GitHub
              </button>
              <button 
                type="button" 
                onClick={() => { setMode("create"); setError(null); }}
                {...stylex.props(styles.toggleBtn, mode === "create" ? styles.toggleActive : styles.toggleInactive)}
              >
                Create Manually
              </button>
            </div>

            {isInstall ? (
              <>
                <div {...stylex.props(styles.fieldGroup)}>
                  <label {...stylex.props(styles.label)}>
                    <GitBranchIcon weight="light" style={{ ...iconSizes.sm, color: colors.primary }} />
                    GitHub Repository, Gist, or Local Path
                  </label>
                  <Input
                    placeholder="e.g. anthropics/skills, vercel-labs/skills, a Gist URL, or /path/to/skill"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                  />
                  <p {...stylex.props(styles.hint)}>
                    Supports GitHub shorthand (`owner/repo`), Gist URLs, or absolute local paths.
                  </p>
                </div>

                <div {...stylex.props(styles.fieldGroup)}>
                  <label {...stylex.props(styles.label)}>
                    <FolderIcon weight="light" style={{ ...iconSizes.sm, color: colors.primary }} />
                    Custom Skill Name (Optional)
                  </label>
                  <Input
                    placeholder="Leave blank to use repository name"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div {...stylex.props(styles.fieldGroup)}>
                  <label {...stylex.props(styles.label)}>
                    <FolderIcon weight="light" style={{ ...iconSizes.sm, color: colors.primary }} />
                    Skill Name
                  </label>
                  <Input
                    placeholder="e.g. my-awesome-skill"
                    value={skillName}
                    onChange={(e) => setSkillName(e.target.value)}
                    required
                  />
                </div>
                
                <div {...stylex.props(styles.fieldGroup)}>
                  <label {...stylex.props(styles.label)}>
                    <FileTextIcon weight="light" style={{ ...iconSizes.sm, color: colors.primary }} />
                    SKILL.md Content
                  </label>
                  <textarea
                    placeholder="Paste your SKILL.md markdown content here..."
                    value={markdownContent}
                    onChange={(e) => setMarkdownContent(e.target.value)}
                    required
                    rows={8}
                    {...stylex.props(styles.textarea)}
                  />
                </div>
              </>
            )}
          </CardContent>

          <CardFooter {...stylex.props(styles.footer)}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={loading}
              style={{ fontSize: 12 }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSubmitDisabled}
              style={{ fontSize: 12 }}
            >
              {submitText}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
