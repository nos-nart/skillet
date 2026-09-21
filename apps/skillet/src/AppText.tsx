import { Text as RNText, type TextProps } from "react-native";

// App-wide text: Space Grotesk by default, JetBrains Mono via `mono`
// (mirrors the old `fonts.sans` / `fonts.mono` tokens). The families are
// registered with the OS at launch via UIAppFonts (see
// scripts/lib/macosInfoPlist.ts + the Xcode Resources phase), so they resolve
// synchronously — no JS font loader, no native font module needed.
// Exported as `Text` so call sites only swap the import line; forwards
// className + style untouched so Uniwind keeps working, with fontFamily
// prepended so an explicit style fontFamily still wins.
export function Text({
  mono = false,
  style,
  ...props
}: TextProps & { mono?: boolean; className?: string }): React.JSX.Element {
  return (
    <RNText
      {...props}
      style={[{ fontFamily: mono ? "JetBrains Mono" : "Space Grotesk" }, style]}
    />
  );
}
