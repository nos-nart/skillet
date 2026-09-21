import React, { useEffect, useState, useMemo } from "react";
import { Pressable, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { SFSymbol } from "@legend-apps/sf-symbol";
import { copyText } from "@skillet/skills-fs";
import type { SyntaxHighlightResult } from "@legend-apps/syntax-parser";
import { getCachedHighlight, highlightFence } from "./services/codeFence";
import { useThemePalette } from "./services/theme";

interface BatchedToken {
  text: string;
  color?: string;
}

function batchLineTokens(
  lineText: string,
  tokens: { startColumn: number; length: number; styleId: number }[],
  colorMap: Map<number, string>,
): BatchedToken[] {
  if (tokens.length === 0) return [{ text: lineText }];
  const runs: BatchedToken[] = [];
  let currentRun = "";
  let currentColor: string | undefined = undefined;
  let lastEnd = 0;

  for (const token of tokens) {
    if (token.startColumn > lastEnd) {
      const gap = lineText.slice(lastEnd, token.startColumn);
      if (currentColor === undefined) {
        currentRun += gap;
      } else {
        if (currentRun) runs.push({ text: currentRun, color: currentColor });
        currentRun = gap;
        currentColor = undefined;
      }
    }
    const color = colorMap.get(token.styleId);
    const chunk = lineText.slice(token.startColumn, token.startColumn + token.length);
    if (color === currentColor) {
      currentRun += chunk;
    } else {
      if (currentRun) runs.push({ text: currentRun, color: currentColor });
      currentRun = chunk;
      currentColor = color;
    }
    lastEnd = token.startColumn + token.length;
  }
  if (lastEnd < lineText.length) {
    const tail = lineText.slice(lastEnd);
    if (currentColor === undefined) {
      currentRun += tail;
    } else {
      if (currentRun) runs.push({ text: currentRun, color: currentColor });
      currentRun = tail;
      currentColor = undefined;
    }
  }
  if (currentRun) runs.push({ text: currentRun, color: currentColor });
  return runs.length > 0 ? runs : [{ text: lineText }];
}

export const SkillCodeFence = React.memo(function SkillCodeFence({
  blockStyle,
  code,
  lang,
  textStyle,
  themeName,
}: {
  blockStyle?: StyleProp<ViewStyle>;
  code: string;
  lang: string;
  textStyle?: StyleProp<TextStyle>;
  themeName: string;
}): React.JSX.Element {
  const c = useThemePalette();
  const [result, setResult] = useState<SyntaxHighlightResult | null>(
    () => getCachedHighlight(code, lang, themeName) ?? null,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedHighlight(code, lang, themeName);
    if (cached) {
      setResult(cached);
      return;
    }
    setResult(null);
    void highlightFence(code, lang, themeName).then((highlighted) => {
      if (!cancelled) setResult(highlighted);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, themeName]);

  const handleCopy = (): void => {
    setCopied(true);
    void copyText(code).catch(() => {});
    setTimeout(() => setCopied(false), 2000);
  };

  const colorByStyleId = useMemo(() => {
    if (!result) return new Map<number, string>();
    return new Map(result.styles.map((entry) => [entry.id, entry.foreground]));
  }, [result]);

  const batchedLines = useMemo(() => {
    if (!result) return null;
    return result.lines.map((line) => ({
      index: line.index,
      tokens: batchLineTokens(line.text, line.tokens, colorByStyleId),
    }));
  }, [result, colorByStyleId]);

  const isDark = themeName === "dark-plus";
  const displayLang = (lang || "code").toUpperCase();

  const cardBg = isDark ? "#1a1b1e" : "#f6f8fa";
  const cardBorder = isDark ? "#2c2d32" : "#e1e4e8";
  const headerBg = isDark ? "#222328" : "#edf0f3";
  const headerBorder = isDark ? "#2c2d32" : "#e1e4e8";
  const defaultTextColor = isDark ? "#e1e4e8" : "#24292e";

  const lineTextStyle = useMemo(
    () => [{ fontFamily: "JetBrains Mono", fontSize: 12, lineHeight: 18, color: defaultTextColor }, textStyle],
    [defaultTextColor, textStyle],
  );

  return (
    <View
      className="my-3 overflow-hidden rounded-lg border"
      style={[
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
          borderCurve: "continuous",
          padding: 0,
        },
        blockStyle,
      ]}
    >
      <View
        className="flex-row items-center justify-between border-b px-3 py-1.5"
        style={{ backgroundColor: headerBg, borderColor: headerBorder }}
      >
        <Text
          className="text-[10px] font-bold tracking-wider text-muted"
          style={{ fontFamily: "JetBrains Mono" }}
        >
          {displayLang}
        </Text>
        <Pressable
          accessibilityLabel={`Copy ${displayLang} snippet`}
          accessibilityRole="button"
          className="flex-row items-center gap-1 rounded px-2 py-0.5 active:opacity-70"
          onPress={handleCopy}
          style={{ borderCurve: "continuous" }}
        >
          <SFSymbol
            color={copied ? "#10b981" : c.muted}
            name={copied ? "checkmark" : "doc.on.doc"}
            size={13}
          />
          <Text
            className={copied ? "text-[10px] font-semibold text-emerald-500" : "text-[10px] font-medium text-muted"}
          >
            {copied ? "Copied" : "Copy"}
          </Text>
        </Pressable>
      </View>
      <View className="p-3.5">
        {!batchedLines ? (
          <Text selectable style={lineTextStyle}>
            {code}
          </Text>
        ) : (
          batchedLines.map((line) => {
            if (line.tokens.length === 1 && !line.tokens[0].color) {
              return (
                <Text key={line.index} selectable style={lineTextStyle}>
                  {line.tokens[0].text || " "}
                </Text>
              );
            }
            return (
              <Text key={line.index} selectable style={lineTextStyle}>
                {line.tokens.map((token, tokenIdx) =>
                  token.color ? (
                    <Text key={tokenIdx} style={{ color: token.color }}>
                      {token.text}
                    </Text>
                  ) : (
                    token.text
                  ),
                )}
              </Text>
            );
          })
        )}
      </View>
    </View>
  );
});
