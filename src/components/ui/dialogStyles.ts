import * as stylex from "@stylexjs/stylex";
import { colors, radius } from "../../tokens.stylex.ts";

export const dialogStyles = stylex.create({
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
  },
  dialog: {
    width: "100%",
    maxWidth: 512,
    backgroundColor: colors.bgPrimary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    borderRadius: radius.lg,
    boxShadow: "0 20px 45px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  closeBtn: {
    color: colors.textMuted,
    cursor: "pointer",
    padding: 4,
    borderRadius: radius.lg,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderStyle: "none",
    transitionProperty: "color, background-color",
    transitionDuration: "150ms",
    ":hover": {
      color: colors.textSecondary,
      backgroundColor: colors.bgHover,
    },
  },
});
