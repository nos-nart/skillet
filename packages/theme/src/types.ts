// Minimal theme chain for scripts/generate-theme-css.ts (Task 4 carry).
// Shapes are verbatim from legend-apps packages/theme/src/types.ts, except the
// @legend-apps/markdown-document + react-native-enriched-markdown references,
// which are structural stand-ins here so this file needs zero new workspace
// dependencies. The full @legend-apps/theme package (index, appTheme,
// generatedThemes) lands with the task that first imports it by name.

export type MarkdownDocumentLayout = {
  content?: {
    horizontalPadding: number;
    maxWidth: number;
    verticalPadding: number;
  };
  blockSpacing?: {
    heading: Record<string, unknown>;
    [key: string]: unknown;
  };
};

export type MarkdownDocumentTheme = Record<string, unknown>;

export type MarkdownStyle = Record<string, unknown>;

export type LegendDisplayThemeName = "light" | "dark" | (string & {});
export type LegendDisplayThemeAppearance = "light" | "dark";

export type LegendDisplayThemeColors = {
  background: string;
  foreground: string;
  muted: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  primary: string;
  link?: string;
  danger: string;
  selection: string;
  code: string;
  codeForeground: string;
  inlineCodeBackground?: string;
  inlineCodeForeground?: string;
  blockquoteBackground: string;
  blockquoteBorder: string;
  tableHeader: string;
  tableRowAlt: string;
  windowBackground: string;
};

export type LegendDisplayThemeBackgroundSource =
  | {
    type: "none";
  }
  | {
    color: string;
    type: "color";
  }
  | {
    imagePath: string;
    type: "image";
  };

export type LegendDisplayThemeBackgroundTint = {
  color: string;
  enabled: boolean;
};

export type LegendDisplayThemeBackground = {
  glassEnabled: boolean;
  opacity: number;
  source: LegendDisplayThemeBackgroundSource;
  tint: LegendDisplayThemeBackgroundTint;
};

export type LegendDisplayThemeFonts = {
  bodyFontFamily?: string;
  codeFontFamily?: string;
};

export type LegendDisplayThemeFile = {
  appearance?: LegendDisplayThemeAppearance;
  background?: LegendDisplayThemeBackground;
  name: LegendDisplayThemeName;
  colors: LegendDisplayThemeColors;
  fonts?: LegendDisplayThemeFonts;
};

export type LegendDisplayTheme = LegendDisplayThemeFile & {
  markdownDocument: MarkdownDocumentTheme;
  markdownStyle: MarkdownStyle;
};

export type MarkdownLayoutThemeName = "default" | (string & {});

export type MarkdownLayoutThemeTypography = {
  blockquoteFontSizeOffset: number;
  bodyFontSize: number;
  codeFontSizeOffset: number;
  headingLineHeightScale: number;
  headingScale: Record<1 | 2 | 3 | 4 | 5 | 6, number>;
  headingWeight: string;
  lineHeightScale: number;
  tableFontSizeOffset: number;
};

export type MarkdownLayoutThemeBlocks = {
  blockquoteBorderWidth: number;
  codeBlockBorderRadius: number;
  codeBlockBorderWidth: number;
  codeBlockPadding: number;
  listGapWidth: number;
  tableBorderRadius: number;
  tableBorderWidth: number;
  tableCellPaddingHorizontal: number;
  tableCellPaddingVertical: number;
};

export type MarkdownLayoutThemeFile = {
  name: MarkdownLayoutThemeName;
  content: NonNullable<MarkdownDocumentLayout["content"]>;
  spacing: MarkdownDocumentLayout["blockSpacing"];
  typography: MarkdownLayoutThemeTypography;
  blocks: MarkdownLayoutThemeBlocks;
};

export type MarkdownLayoutTheme = MarkdownLayoutThemeFile & {
  markdownLayout: MarkdownDocumentLayout;
};

export type LegendThemeName = LegendDisplayThemeName;
export type LegendThemeAppearance = LegendDisplayThemeAppearance;
export type LegendThemeColors = LegendDisplayThemeColors;
export type LegendThemeBackgroundSource = LegendDisplayThemeBackgroundSource;
export type LegendThemeBackgroundTint = LegendDisplayThemeBackgroundTint;
export type LegendThemeBackground = LegendDisplayThemeBackground;
export type LegendThemeFile = LegendDisplayThemeFile;
export type LegendTheme = LegendDisplayTheme;
