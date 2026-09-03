import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../../tokens.stylex.ts";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "warning" | "info" | "success" | "accent";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    paddingLeft: 7,
    paddingRight: 7,
    paddingTop: 1,
    paddingBottom: 1,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: "0.02em",
    lineHeight: "16px",
    transitionProperty: "background-color, border-color, color",
    transitionDuration: "150ms",
  },
  default: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
  },
  secondary: {
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgTertiary,
    color: colors.textPrimary,
  },
  destructive: {
    borderColor: colors.destructiveBorder,
    backgroundColor: colors.destructiveSoft,
    color: colors.destructive,
  },
  outline: {
    color: colors.textPrimary,
    borderColor: colors.borderDefault,
  },
  warning: {
    borderColor: colors.warningBorder,
    backgroundColor: colors.warningSoft,
    color: colors.warningHover,
  },
  info: {
    borderColor: colors.infoBorder,
    backgroundColor: colors.infoSoft,
    color: colors.infoHover,
  },
  success: {
    borderColor: colors.successBorder,
    backgroundColor: colors.successSoft,
    color: colors.successHover,
  },
  accent: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primarySoft,
    color: colors.primaryHover,
  },
});

const variantMap = {
  default: styles.default,
  secondary: styles.secondary,
  destructive: styles.destructive,
  outline: styles.outline,
  warning: styles.warning,
  info: styles.info,
  success: styles.success,
  accent: styles.accent,
} satisfies Record<BadgeVariant, stylex.StyleXStyles>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const sx = stylex.props(styles.base, variantMap[variant]);
  return (
    <div
      {...props}
      {...sx}
      className={className ? `${sx.className} ${className}` : sx.className}
    />
  );
}

export { Badge };
export type { BadgeVariant };
