import React, { useState } from "react";
import * as stylex from "@stylexjs/stylex";
import { XIcon, BookmarkSimpleIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";
import { dialogStyles } from "./ui/dialogStyles.ts";
import { colors, iconSizes } from "../tokens.stylex.ts";

const styles = stylex.create({
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 16,
    borderBottom: `1px solid ${colors.borderDefault}`,
    backgroundColor: colors.bgSecondary,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontWeight: 600,
    color: colors.textPrimary,
    fontSize: 14,
  },
  form: {
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 500,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 12,
  },
  textarea: {
    width: "100%",
    minHeight: 160,
    padding: 12,
    fontSize: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    outline: "none",
    resize: "vertical" as const,
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
    paddingTop: 8,
  },
});

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (urls: string[]) => void;
}

export function AddBookmarkDialog({ isOpen, onClose, onSave }: AddBookmarkDialogProps) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urlRegex = /https?:\/\/(?:www\.)?(?:skills\.sh|github\.com)\/[^\s]+/g;
    const matches = text.match(urlRegex) || [];
    
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    const shortForms = lines.filter(l => l.match(/^[\w.-]+\/[\w.-]+(?:\/[\w.-]+)*$/));

    const allUrls = Array.from(new Set([...matches, ...shortForms]));
    
    if (allUrls.length > 0) {
      onSave(allUrls);
    }
    setText("");
    onClose();
  };

  return (
    <div {...stylex.props(dialogStyles.overlay)}>
      <div {...stylex.props(dialogStyles.dialog)}>
        <div {...stylex.props(styles.header)}>
          <div {...stylex.props(styles.headerLeft)}>
            <BookmarkSimpleIcon weight="bold" style={{ ...iconSizes.lg, color: colors.primary }} />
            <h3 {...stylex.props(styles.headerTitle)}>Add Bookmarks</h3>
          </div>
          <button
            onClick={onClose}
            {...stylex.props(dialogStyles.closeBtn)}
          >
            <XIcon style={iconSizes.lg} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} {...stylex.props(styles.form)}>
          <div>
            <label {...stylex.props(styles.label)}>
              Paste URLs or Text
            </label>
            <p {...stylex.props(styles.hint)}>
              You can paste a list of skills.sh URLs, GitHub links, or plain text containing links. We'll automatically extract the skills.
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"e.g. https://skills.sh/dmmulroy/anti-slop\ncursor/plugins/deslop"}
              {...stylex.props(styles.textarea)}
            />
          </div>
          
          <div {...stylex.props(styles.footer)}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!text.trim()}>
              Save Bookmarks
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
