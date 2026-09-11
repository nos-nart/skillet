import { useEffect, useState } from "react";
import { Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import type { SyntaxHighlightResult } from "@legend-apps/syntax-parser";
import { highlightFence } from "./services/codeFence";

export function SkillCodeFence({
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
  const [result, setResult] = useState<SyntaxHighlightResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    void highlightFence(code, lang, themeName).then((highlighted) => {
      if (!cancelled) setResult(highlighted);
    });
    return () => {
      cancelled = true;
    };
  }, [code, lang, themeName]);

  if (!result) return <View style={blockStyle}><Text style={textStyle}>{code}</Text></View>;

  const colorByStyleId = new Map(result.styles.map((entry) => [entry.id, entry.foreground]));
  return (
    <View style={blockStyle}>
      {result.lines.map((line) => (
        <Text key={line.index} style={textStyle}>
          {line.tokens.map((token, tokenIndex) => (
            <Text key={tokenIndex} style={{ color: colorByStyleId.get(token.styleId) }}>
              {line.text.slice(token.startColumn, token.startColumn + token.length)}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}
