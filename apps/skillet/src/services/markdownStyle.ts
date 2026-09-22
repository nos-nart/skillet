import type { MarkdownStyle } from "react-native-enriched-markdown";
import { getLegendDisplayTheme, type LegendDisplayThemeAppearance } from "../displayTheme";

export function createSkilletMarkdownStyle(appearance: LegendDisplayThemeAppearance): MarkdownStyle {
  const sharedStyle = getLegendDisplayTheme(appearance).markdownStyle;
  // App fonts are OS-registered at launch via UIAppFonts (no loader needed).
  const bodyFontFamily = "Space Grotesk";
  const codeFontFamily = "JetBrains Mono";
  const withBody = <T extends { fontFamily?: string }>(s: T): T => ({
    ...s,
    fontFamily: bodyFontFamily,
  });
  return {
    ...sharedStyle,
    blockquote: withBody({
      ...sharedStyle.blockquote,
      fontSize: 15,
      lineHeight: 22,
    }),
    code: {
      ...sharedStyle.code,
      fontFamily: codeFontFamily,
      fontSize: 13,
    },
    codeBlock: {
      ...sharedStyle.codeBlock,
      backgroundColor: appearance === "dark" ? "#1a1b1e" : "#f6f8fa",
      borderColor: appearance === "dark" ? "#2c2d32" : "#e1e4e8",
      borderRadius: 8,
      borderWidth: 1,
      color: appearance === "dark" ? "#e1e4e8" : "#24292e",
      fontFamily: codeFontFamily,
      fontSize: 13,
      lineHeight: 20,
      padding: 12,
    },
    h1: withBody({
      ...sharedStyle.h1,
      fontSize: 22,
      lineHeight: 28,
    }),
    h2: withBody({
      ...sharedStyle.h2,
      fontSize: 19,
      lineHeight: 25,
    }),
    list: withBody({
      ...sharedStyle.list,
      fontSize: 15,
      lineHeight: 22,
    }),
    paragraph: withBody({
      ...sharedStyle.paragraph,
      fontSize: 15,
      lineHeight: 22,
    }),
  };
}
