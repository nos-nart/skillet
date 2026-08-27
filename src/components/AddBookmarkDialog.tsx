import React, { useState } from "react";
import { X, BookmarkSimple } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";

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
    // Extract skills.sh or github URLs
    const urlRegex = /https?:\/\/(?:www\.)?(?:skills\.sh|github\.com)\/[^\s]+/g;
    const matches = text.match(urlRegex) || [];
    
    // Also support short forms like user/repo if they are just on their own lines
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-3 px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <BookmarkSimple className="w-5 h-5 text-primary" weight="bold" />
            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Add Bookmarks</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-200/50 dark:hover:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
              Paste URLs or Text
            </label>
            <p className="text-xs text-zinc-500 mb-3">
              You can paste a list of skills.sh URLs, GitHub links, or plain text containing links. We'll automatically extract the skills.
            </p>
            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="e.g. https://skills.sh/dmmulroy/anti-slop&#10;cursor/plugins/deslop"
              className="w-full min-h-[160px] p-3 text-sm rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-primary-border focus:border-primary transition-all resize-y"
            />
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
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
