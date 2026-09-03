import * as stylex from "@stylexjs/stylex";

// =============================================================================
// Color Tokens
// =============================================================================

export const colors = stylex.defineVars({
  // Primary (Orange)
  primary: "var(--color-orange-500)",
  primaryHover: "var(--color-orange-600)",
  primaryActive: "var(--color-orange-700)",
  primaryLight: "var(--color-orange-400)",
  primarySoft: "color-mix(in oklch, var(--color-orange-500) 10%, transparent)",
  primaryBorder: "color-mix(in oklch, var(--color-orange-500) 20%, transparent)",

  // Success (Emerald)
  success: "var(--color-emerald-500)",
  successHover: "var(--color-emerald-600)",
  successLight: "var(--color-emerald-400)",
  successSoft: "color-mix(in oklch, var(--color-emerald-500) 10%, transparent)",
  successBorder: "color-mix(in oklch, var(--color-emerald-500) 20%, transparent)",

  // Destructive (Red)
  destructive: "var(--color-red-500)",
  destructiveHover: "var(--color-red-600)",
  destructiveLight: "var(--color-red-400)",
  destructiveSoft: "color-mix(in oklch, var(--color-red-500) 10%, transparent)",
  destructiveBorder: "color-mix(in oklch, var(--color-red-500) 20%, transparent)",

  // Warning (Amber)
  warning: "var(--color-amber-500)",
  warningHover: "var(--color-amber-600)",
  warningLight: "var(--color-amber-400)",
  warningSoft: "color-mix(in oklch, var(--color-amber-500) 15%, transparent)",
  warningBorder: "color-mix(in oklch, var(--color-amber-500) 30%, transparent)",

  // Info (Sky)
  info: "var(--color-sky-500)",
  infoHover: "var(--color-sky-600)",
  infoLight: "var(--color-sky-400)",
  infoSoft: "color-mix(in oklch, var(--color-sky-500) 15%, transparent)",
  infoBorder: "color-mix(in oklch, var(--color-sky-500) 30%, transparent)",

  // Neutrals — respond to .dark via CSS variables
  bgPrimary: "var(--sk-bg-primary)",
  bgSecondary: "var(--sk-bg-secondary)",
  bgTertiary: "var(--sk-bg-tertiary)",
  bgHover: "var(--sk-bg-hover)",
  bgMuted: "var(--sk-bg-muted)",
  bgPanel: "var(--sk-bg-panel)",

  textPrimary: "var(--sk-text-primary)",
  textSecondary: "var(--sk-text-secondary)",
  textMuted: "var(--sk-text-muted)",
  textDark: "var(--sk-text-dark)",
  textInverse: "oklch(1 0 0)",

  borderDefault: "var(--sk-border-default)",
  borderSubtle: "var(--sk-border-subtle)",

  // Hover overlays
  bgHoverLight: "oklch(0.871 0.006 286.286)",
});

// =============================================================================
// Spacing Tokens
// =============================================================================

export const spacing = stylex.defineVars({
  "0": "0px",
  "0.5": "2px",
  "1": "4px",
  "1.5": "6px",
  "2": "8px",
  "2.5": "10px",
  "3": "12px",
  "4": "16px",
  "5": "20px",
  "6": "24px",
  "8": "32px",
  "10": "40px",
  "12": "48px",
  "16": "64px",
});

// =============================================================================
// Radius Tokens
// =============================================================================

export const radius = stylex.defineVars({
  none: "0px",
  sm: "4px",
  md: "6px",
  lg: "8px",
  xl: "12px",
  "2xl": "16px",
  full: "9999px",
});

// =============================================================================
// Font Size Tokens
// =============================================================================

export const fontSize = stylex.defineVars({
  xs: "0.75rem",     // 12px
  sm: "0.875rem",    // 14px
  base: "1rem",      // 16px
  lg: "1.125rem",    // 18px
  xl: "1.25rem",     // 20px
  "2xl": "1.5rem",   // 24px
});

// =============================================================================
// Font Weight Tokens
// =============================================================================

export const fontWeight = stylex.defineVars({
  normal: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
});

// =============================================================================
// Font Family Tokens
// =============================================================================

export const fonts = stylex.defineVars({
  sans: '"Space Grotesk", system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
});

// =============================================================================
// Duration Tokens
// =============================================================================

export const duration = stylex.defineVars({
  fast: "150ms",
  normal: "200ms",
  slow: "300ms",
  slower: "500ms",
});

// =============================================================================
// Easing Tokens
// =============================================================================

export const easings = stylex.defineVars({
  outStrong: "cubic-bezier(0.23, 1, 0.32, 1)",
  spring: "cubic-bezier(0.32, 0.72, 0, 1)",
  standard: "cubic-bezier(0.24, 1, 0.4, 1)",
});

// =============================================================================
// Icon Size Map (not defineVars — used as inline style objects)
// =============================================================================

export const iconSizes = {
  xs: { width: 12, height: 12 },
  sm: { width: 14, height: 14 },
  md: { width: 16, height: 16 },
  lg: { width: 20, height: 20 },
  xl: { width: 24, height: 24 },
  xxl: { width: 32, height: 32 },
} as const;
