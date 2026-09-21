import type { MarkdownStyle } from "react-native-enriched-markdown";
import { getLegendDisplayTheme } from "@legend-apps/theme";
import type { LegendDisplayThemeAppearance } from "@legend-apps/theme";

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
      borderRadius: 7,
      fontFamily: codeFontFamily,
      fontSize: 12,
      lineHeight: 18,
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
