import type { MarkdownStyle } from "react-native-enriched-markdown";
import { generatedDisplayThemeFiles } from "./generatedThemes";
import type {
  LegendDisplayTheme,
  LegendDisplayThemeFile,
} from "./types";

export type {
  LegendDisplayTheme,
  LegendDisplayThemeAppearance,
  LegendDisplayThemeFile,
  LegendDisplayThemeName,
} from "./types";

function createSkilletDisplayTheme(theme: LegendDisplayThemeFile): LegendDisplayTheme {
  const { colors } = theme;
  const bodyFontFamily = theme.fonts?.bodyFontFamily;
  // Menlo ships with macOS; legend uses the same default, so code always has
  // a real monospace face with zero font bundling.
  const codeFontFamily = theme.fonts?.codeFontFamily ?? "Menlo";

  return {
    ...theme,
    markdownDocument: {
      backgroundColor: colors.background,
      errorColor: colors.danger,
      foregroundColor: colors.foreground,
      mutedForegroundColor: colors.muted,
      selectionColor: colors.selection,
    },
    markdownStyle: {
      blockquote: {
        backgroundColor: colors.blockquoteBackground,
        borderColor: colors.blockquoteBorder,
        borderWidth: 3,
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 15,
        lineHeight: 23,
      },
      code: {
        backgroundColor: colors.inlineCodeBackground ?? colors.surfaceMuted,
        color: colors.inlineCodeForeground ?? colors.foreground,
        fontFamily: codeFontFamily,
        fontSize: 14,
      },
      codeBlock: {
        backgroundColor: colors.code,
        borderColor: colors.border,
        borderRadius: 6,
        borderWidth: 1,
        color: colors.codeForeground,
        fontFamily: codeFontFamily,
        fontSize: 13,
        lineHeight: 21.45,
        padding: 20,
      },
      h1: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 30,
        fontWeight: "700",
        lineHeight: 38,
        marginBottom: 8,
      },
      h2: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 32,
        marginBottom: 6,
      },
      h3: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 20,
        fontWeight: "700",
        lineHeight: 28,
        marginBottom: 4,
      },
      h4: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 18,
        fontWeight: "700",
        lineHeight: 26,
        marginBottom: 4,
      },
      h5: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 16,
        fontWeight: "700",
        lineHeight: 24,
        marginBottom: 4,
      },
      h6: {
        color: colors.muted,
        fontFamily: bodyFontFamily,
        fontSize: 14,
        fontWeight: "700",
        lineHeight: 22,
        marginBottom: 4,
      },
      link: {
        color: colors.link ?? colors.primary,
        underline: true,
      },
      list: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 16,
        gapWidth: 8,
        lineHeight: 25,
        markerColor: colors.muted,
      },
      paragraph: {
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 16,
        lineHeight: 25,
      },
      table: {
        borderColor: colors.border,
        borderRadius: 6,
        borderWidth: 1,
        cellPaddingHorizontal: 8,
        cellPaddingVertical: 6,
        color: colors.foreground,
        fontFamily: bodyFontFamily,
        fontSize: 14,
        headerBackgroundColor: colors.tableHeader,
        headerTextColor: colors.foreground,
        rowEvenBackgroundColor: colors.surface,
        rowOddBackgroundColor: colors.tableRowAlt,
      },
      taskList: {
        borderColor: colors.muted,
        checkedColor: colors.primary,
        checkedTextColor: colors.muted,
      },
    } satisfies MarkdownStyle,
  };
}

const legendDisplayThemeMap = new Map<string, LegendDisplayTheme>(
  // SAFETY: generatedDisplayThemeFiles mirrors legend's theme files 1:1
  // (name/appearance/colors/fonts); entries satisfy the file type.
  (generatedDisplayThemeFiles as LegendDisplayThemeFile[]).map((themeFile) => [
    themeFile.name,
    createSkilletDisplayTheme(themeFile),
  ]),
);

export function getLegendDisplayTheme(themeName: string | null | undefined): LegendDisplayTheme {
  const found = legendDisplayThemeMap.get(themeName ?? "");
  if (found) return found;
  // SAFETY: "light" ships in generatedDisplayThemeFiles, so this lookup never misses.
  return legendDisplayThemeMap.get("light") as LegendDisplayTheme;
}
