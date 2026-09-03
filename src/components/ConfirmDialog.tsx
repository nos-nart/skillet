import React from "react";
import * as stylex from "@stylexjs/stylex";
import { WarningIcon, TrashIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "./ui/button.tsx";
import { dialogStyles } from "./ui/dialogStyles.ts";
import { colors, iconSizes } from "../tokens.stylex.ts";

const styles = stylex.create({
  body: {
    padding: 20,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  topRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    padding: 8,
    borderRadius: 8,
  },
  iconDestructive: {
    backgroundColor: colors.destructiveSoft,
    color: colors.destructiveHover,
  },
  iconDefault: {
    backgroundColor: colors.primarySoft,
    color: colors.primaryHover,
  },
  dialogTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 1.6,
    paddingLeft: 40,
  },
  footer: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.bgSecondary,
    borderTopWidth: 1,
    borderTopStyle: "solid",
    borderTopColor: colors.borderDefault,
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
});

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
    <div {...stylex.props(dialogStyles.overlay)}>
      <div {...stylex.props(dialogStyles.dialog)}>
        <div {...stylex.props(styles.body)}>
          <div {...stylex.props(styles.topRow)}>
            <div {...stylex.props(styles.topLeft)}>
              <div {...stylex.props(styles.iconWrap, variant === "destructive" ? styles.iconDestructive : styles.iconDefault)}>
                {variant === "destructive" ? (
                  <TrashIcon weight="light" style={iconSizes.lg} />
                ) : (
                  <WarningIcon weight="light" style={iconSizes.lg} />
                )}
              </div>
              <h3 {...stylex.props(styles.dialogTitle)}>{title}</h3>
            </div>
            <button
              onClick={onCancel}
              {...stylex.props(dialogStyles.closeBtn)}
            >
              <XIcon weight="light" style={iconSizes.md} />
            </button>
          </div>

          <p {...stylex.props(styles.desc)}>
            {description}
          </p>
        </div>

        <div {...stylex.props(styles.footer)}>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
            style={{ fontSize: 12 }}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={variant}
            size="sm"
            onClick={onConfirm}
            disabled={isLoading}
            style={{ fontSize: 12, gap: 6 }}
          >
            {variant === "destructive" && <TrashIcon weight="light" style={iconSizes.sm} />}
            <span>{isLoading ? "Processing..." : confirmLabel}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
