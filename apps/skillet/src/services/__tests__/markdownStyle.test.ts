import { createSkilletMarkdownStyle } from "../markdownStyle";

test("applies skillet sizing overrides on top of theme style", () => {
  const style = createSkilletMarkdownStyle("dark");
  // SAFETY: module always sets these keys; assertion only narrows the optional MarkdownStyle prop for strict TS.
  expect(style.paragraph!.fontSize).toBe(15);
  expect(style.paragraph!.lineHeight).toBe(22);
  expect(style.codeBlock!.fontSize).toBe(13);
  expect(style.codeBlock!.padding).toBe(12);
  expect(style.codeBlock!.borderRadius).toBe(8);
  expect(style.h1!.fontSize).toBe(22);
  expect(style.code!.fontSize).toBe(13);
});

test("light theme keeps light colors with app fonts under overrides", () => {
  const style = createSkilletMarkdownStyle("light");
  // SAFETY: module always sets these keys; assertion only narrows the optional MarkdownStyle prop for strict TS.
  expect(style.codeBlock!.fontFamily).toBe("JetBrains Mono");
  expect(style.paragraph!.fontFamily).toBe("Space Grotesk");
  expect(style.paragraph!.color).toBe("#111827");
});
