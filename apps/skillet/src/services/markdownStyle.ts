import type { MarkdownStyle } from "react-native-enriched-markdown";
import { getLegendDisplayTheme } from "@legend-apps/theme";
import type { LegendDisplayThemeAppearance } from "@legend-apps/theme";

export function createSkilletMarkdownStyle(appearance: LegendDisplayThemeAppearance): MarkdownStyle {
  const sharedStyle = getLegendDisplayTheme(appearance).markdownStyle;
  return {
    ...sharedStyle,
    blockquote: {
      ...sharedStyle.blockquote,
      fontSize: 15,
      lineHeight: 22,
    },
    code: {
      ...sharedStyle.code,
      fontSize: 13,
    },
    codeBlock: {
      ...sharedStyle.codeBlock,
      borderRadius: 7,
      fontSize: 12,
      lineHeight: 18,
      padding: 12,
    },
    h1: {
      ...sharedStyle.h1,
      fontSize: 22,
      lineHeight: 28,
    },
    h2: {
      ...sharedStyle.h2,
      fontSize: 19,
      lineHeight: 25,
    },
    list: {
      ...sharedStyle.list,
      fontSize: 15,
      lineHeight: 22,
    },
    paragraph: {
      ...sharedStyle.paragraph,
      fontSize: 15,
      lineHeight: 22,
    },
  };
}
