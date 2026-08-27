import React from "react";
import { Warning, Trash, X } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "default";
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        <div className="p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${variant === "destructive" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"}`}>
                {variant === "destructive" ? (
                  <Trash weight="light" className="w-5 h-5" />
                ) : (
                  <Warning weight="light" className="w-5 h-5" />
                )}
              </div>
              <h3 className="text-sm font-bold text-zinc-100">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded-md hover:bg-zinc-800"
            >
              <X weight="light" className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed pl-10">
            {description}
          </p>
        </div>

        <div className="px-5 py-3.5 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            className="text-xs h-8 gap-1.5"
          >
            {variant === "destructive" && <Trash weight="light" className="w-3.5 h-3.5" />}
            <span>{isLoading ? "Processing..." : confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
