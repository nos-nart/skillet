import type { LegendDisplayThemeFile, MarkdownLayoutThemeFile } from "./types";

export const generatedDisplayThemeFiles = [
  {
    "name": "light",
    "appearance": "light",
    "colors": {
      "background": "#f5f6f8",
      "foreground": "#111827",
      "muted": "#6b7280",
      "surface": "#ffffff",
      "surfaceMuted": "#f3f4f6",
      "border": "#d1d5db",
      "primary": "#2563eb",
      "danger": "#b42318",
      "selection": "auto",
      "code": "#111827",
      "codeForeground": "#f9fafb",
      "inlineCodeBackground": "#e5e7eb",
      "blockquoteBackground": "#f8fafc",
      "blockquoteBorder": "#94a3b8",
      "tableHeader": "#f3f4f6",
      "tableRowAlt": "#f9fafb",
      "windowBackground": "#f5f6f8"
    },
    "fonts": {
      "codeFontFamily": "Menlo"
    }
  },
  {
    "name": "dark",
    "appearance": "dark",
    "colors": {
      "background": "#191A1B",
      "foreground": "#f5f5f5",
      "muted": "#a3a3a3",
      "surface": "#242526",
      "surfaceMuted": "#2d2e30",
      "border": "#3e4042",
      "primary": "#60a5fa",
      "danger": "#f87171",
      "selection": "auto",
      "code": "#111213",
      "codeForeground": "#f5f5f5",
      "inlineCodeForeground": "#eb5757",
      "blockquoteBackground": "#202122",
      "blockquoteBorder": "#6f7377",
      "tableHeader": "#2a2b2d",
      "tableRowAlt": "#1f2021",
      "windowBackground": "#191A1B"
    },
    "fonts": {
      "codeFontFamily": "Menlo"
    }
  }
] satisfies LegendDisplayThemeFile[];

export const generatedMarkdownLayoutThemeFiles = [
  {
    "name": "default",
    "content": {
      "horizontalPadding": 40,
      "maxWidth": 820,
      "verticalPadding": 48
    },
    "typography": {
      "blockquoteFontSizeOffset": -1,
      "bodyFontSize": 16,
      "codeFontSizeOffset": -2,
      "headingLineHeightScale": 1.45,
      "headingScale": {
        "1": 1.875,
        "2": 1.5,
        "3": 1.25,
        "4": 1.125,
        "5": 1,
        "6": 0.9375
      },
      "headingWeight": "700",
      "lineHeightScale": 1.58,
      "tableFontSizeOffset": -2
    },
    "spacing": {
      "blockquote": {
        "marginBottom": 24,
        "marginTop": 24
      },
      "codeBlock": {
        "marginBottom": 51.2,
        "marginTop": 20
      },
      "fallback": {
        "marginBottom": 19.2,
        "marginTop": 19.2
      },
      "heading": {
        "1": {
          "marginBottom": 24,
          "marginTop": 48
        },
        "2": {
          "marginBottom": 19.2,
          "marginTop": 40
        },
        "3": {
          "marginBottom": 16,
          "marginTop": 32
        },
        "4": {
          "marginBottom": 12.8,
          "marginTop": 28
        },
        "5": {
          "marginBottom": 9.6,
          "marginTop": 24
        },
        "6": {
          "marginBottom": 9.6,
          "marginTop": 24
        }
      },
      "list": {
        "marginBottom": 19.2,
        "marginTop": 19.2
      },
      "paragraph": {
        "marginBottom": 19.2,
        "marginTop": 19.2
      },
      "table": {
        "marginBottom": 24,
        "marginTop": 24
      },
      "thematicBreak": {
        "marginBottom": 48,
        "marginTop": 48
      }
    },
    "blocks": {
      "blockquoteBorderWidth": 3,
      "codeBlockBorderRadius": 6,
      "codeBlockBorderWidth": 1,
      "codeBlockPadding": 20,
      "listGapWidth": 8,
      "tableBorderRadius": 6,
      "tableBorderWidth": 1,
      "tableCellPaddingHorizontal": 8,
      "tableCellPaddingVertical": 6
    }
  }
] satisfies MarkdownLayoutThemeFile[];

export const generatedThemeFiles = generatedDisplayThemeFiles;
