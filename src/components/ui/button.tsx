import * as React from "react";
import * as stylex from "@stylexjs/stylex";
import { colors } from "../../tokens.stylex.ts";

type Variant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
type Size = "default" | "sm" | "lg" | "icon";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "1ch",
    whiteSpace: "nowrap",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    transitionProperty: "all",
    transitionDuration: "150ms",
    transitionTimingFunction: "ease-out",
    cursor: "pointer",
    userSelect: "none",
    outline: "none",
    boxSizing: "border-box",
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "transparent",
    backgroundColor: "transparent",
    ":active": { transform: "translateY(1px) scale(0.98)" },
    ":focus-visible": {
      outline: "none",
      boxShadow: "0 0 0 2px var(--color-orange-500)",
    },
    ":disabled": {
      pointerEvents: "none",
      opacity: 0.5,
      boxShadow: "none",
    },
  },
  default: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
    borderColor: "rgba(255, 255, 255, 0.12)",
    fontWeight: 600,
    boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.28), 0 1px 2px rgba(0, 0, 0, 0.24)",
    ":hover": {
      backgroundColor: colors.primaryHover,
      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.35), 0 2px 4px rgba(0, 0, 0, 0.28)",
    },
    ":active": {
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.35)",
    },
  },
  destructive: {
    backgroundColor: colors.destructiveSoft,
    color: colors.destructiveHover,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.destructiveBorder,
    fontWeight: 600,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
    ":hover": {
      backgroundColor: colors.destructiveBorder,
      color: colors.destructive,
    },
    ":active": {
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.15)",
    },
  },
  outline: {
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    backgroundColor: colors.bgPrimary,
    color: colors.textPrimary,
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.06)",
    ":hover": {
      backgroundColor: colors.bgTertiary,
      borderColor: colors.borderSubtle,
    },
    ":active": {
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.1)",
    },
  },
  secondary: {
    backgroundColor: colors.bgTertiary,
    color: colors.textPrimary,
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: colors.borderDefault,
    fontWeight: 500,
    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
    ":hover": {
      backgroundColor: colors.bgHover,
      color: colors.textPrimary,
      borderColor: colors.borderSubtle,
    },
    ":active": {
      boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.12)",
    },
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: colors.textSecondary,
    fontWeight: 500,
    ":hover": {
      backgroundColor: colors.bgTertiary,
      color: colors.textPrimary,
    },
  },
  link: {
    color: colors.primaryHover,
    borderColor: "transparent",
    textDecoration: "none",
    textUnderlineOffset: 4,
    fontWeight: 500,
    ":hover": { textDecoration: "underline" },
  },
  sizeDefault: {
    height: 32,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 12,
    lineHeight: 1,
    gap: "1ch",
  },
  sizeSm: {
    height: 28,
    borderRadius: 6,
    paddingLeft: 9,
    paddingRight: 9,
    fontSize: 11,
    lineHeight: 1,
    gap: "1ch",
  },
  sizeLg: {
    height: 36,
    borderRadius: 8,
    paddingLeft: 14,
    paddingRight: 14,
    fontSize: 13,
    lineHeight: 1,
    gap: "1ch",
  },
  sizeIcon: {
    height: 28,
    width: 28,
    paddingLeft: 0,
    paddingRight: 0,
    borderRadius: 6,
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
} satisfies Record<Variant, stylex.StyleXStyles>;

const sizeStyles = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
} satisfies Record<Size, stylex.StyleXStyles>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", style, ...props }, ref) => {
    const sx = stylex.props(styles.base, variantStyles[variant], sizeStyles[size]);
    return (
      <button
        ref={ref}
        {...props}
        {...sx}
        style={{ ...sx.style, ...style }}
        className={className ? `${sx.className} ${className}` : sx.className}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, styles as buttonVariants };
export type { Variant as ButtonVariant, Size as ButtonSize };
