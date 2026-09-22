import { getLegendDisplayTheme } from "../../displayTheme";

test("builds markdownStyle with Menlo code font for both appearances", () => {
  for (const appearance of ["light", "dark"] as const) {
    const theme = getLegendDisplayTheme(appearance);
    // SAFETY: builder always sets code/codeBlock; assertion only narrows the optional MarkdownStyle prop for strict TS.
    expect(theme.markdownStyle.codeBlock!.fontFamily).toBe("Menlo");
    expect(theme.markdownStyle.code!.fontFamily).toBe("Menlo");
  }
});

test("dark and light codeBlock colors differ", () => {
  const dark = getLegendDisplayTheme("dark");
  const light = getLegendDisplayTheme("light");
  // SAFETY: builder always sets codeBlock; assertion only narrows the optional MarkdownStyle prop for strict TS.
  expect(dark.markdownStyle.codeBlock!.backgroundColor).not.toBe(
    light.markdownStyle.codeBlock!.backgroundColor,
  );
});

test("falls back to light on unknown or null name", () => {
  expect(getLegendDisplayTheme("nope")).toEqual(getLegendDisplayTheme("light"));
  expect(getLegendDisplayTheme(null)).toEqual(getLegendDisplayTheme("light"));
});
