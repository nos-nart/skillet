import type { SyntaxHighlightResult } from "@legend-apps/syntax-parser";

export type MarkdownSpan =
  | { type: "prose"; text: string }
  | { type: "fence"; lang: string; code: string };

export interface CodeFenceDeps {
  ensureGrammar?: (lang: string) => Promise<unknown>;
  highlight?: (code: string, lang: string, theme: string) => Promise<SyntaxHighlightResult>;
}

export function splitMarkdownFences(body: string): MarkdownSpan[] {
  const spans: MarkdownSpan[] = [];
  // Fence scope: triple-backtick fences with a trailing newline only. No
  // 4-backtick, tilde, or indented variants — fine for SKILL.md, which the
  // splitter only ever sees.
  const fenceRe = /```([^\n]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = fenceRe.exec(body)) !== null) {
    if (m.index > lastIndex) {
      spans.push({ type: "prose", text: body.slice(lastIndex, m.index) });
    }
    spans.push({ type: "fence", lang: m[1].trim(), code: m[2].replace(/\n$/, "") });
    lastIndex = m.index + m[0].length;
  }
  // A trailing unclosed fence stays prose: raw backticks stay visible rather
  // than hiding content inside a code block.
  if (lastIndex < body.length) {
    spans.push({ type: "prose", text: body.slice(lastIndex) });
  }
  if (spans.length === 0) {
    spans.push({ type: "prose", text: body });
  }
  return spans;
}

export function syntaxThemeForAppearance(appearance: "light" | "dark"): string {
  return appearance === "dark" ? "dark-plus" : "github-light";
}

let warnedParserUnavailable = false;

// SAFETY: __DEV__ is injected by the RN runtime and absent under jest and
// in some hosts; the optional field read models exactly that absence, so no
// typeof check is needed.
const hostFlags = globalThis as { __DEV__?: boolean };

function warnParserUnavailable(): void {
  if (warnedParserUnavailable) return;
  warnedParserUnavailable = true;
  if (hostFlags.__DEV__ === true) {
    console.warn(
      "[skillet] syntax parser unavailable, rendering plain code blocks. " +
        "Run `bun run skillet pods macos` to link RNSyntaxParser.",
    );
  }
}

interface NativeSyntaxParser {
  ensureSyntaxGrammar: (lang: string) => Promise<unknown>;
  highlightString: (
    code: string,
    lang: string,
    theme: string,
  ) => Promise<SyntaxHighlightResult>;
}

// Guards the native highlight result at the JS boundary (spec §4): a
// malformed token run collapses its fence to the themed fallback instead of
// redboxing the render site. `startColumn`/`length` are treated as JS UTF-16
// code-unit offsets (consumed via `String.slice`); verify non-ASCII fences
// on-device as follow-up.
export function isWellFormedHighlightResult(value: unknown): value is SyntaxHighlightResult {
  if (typeof value !== "object" || value === null) return false;
  if (!("lines" in value) || !("styles" in value)) return false;
  const { lines, styles } = value;
  if (!Array.isArray(lines) || !Array.isArray(styles)) return false;
  for (const line of lines) {
    if (typeof line !== "object" || line === null) return false;
    if (!("index" in line) || !("text" in line) || !("tokens" in line)) return false;
    if (typeof line.index !== "number" || typeof line.text !== "string") return false;
    const { tokens } = line;
    if (!Array.isArray(tokens)) return false;
    for (const token of tokens) {
      if (typeof token !== "object" || token === null) return false;
      if (!("startColumn" in token) || !("length" in token)) return false;
      if (typeof token.startColumn !== "number" || typeof token.length !== "number") {
        return false;
      }
    }
  }
  return true;
}

export async function highlightFence(
  code: string,
  lang: string,
  themeName: string,
  deps: CodeFenceDeps = {},
): Promise<SyntaxHighlightResult | null> {
  if (lang === "") return null;
  try {
    let ensureGrammar = deps.ensureGrammar;
    let highlight = deps.highlight;
    if (ensureGrammar === undefined || highlight === undefined) {
      // No static import: the parser evaluates react-native-nitro-modules
      // native setup at import time, which cannot run under jest. Requiring it
      // lazily keeps the real module unloaded in tests (fakes are injected) and
      // in hosts that only render prose; Metro caches the module in prod. The
      // annotated const (no assertion) pins the expected shape. The require
      // lives inside the try so a missing module returns null through the
      // fallback contract instead of throwing. Prod-only path: evaluating this
      // line IS the nitro crash under jest, so it stays uncovered — do not
      // attempt to cover it.
      const native: NativeSyntaxParser = require("@legend-apps/syntax-parser");
      if (ensureGrammar === undefined) ensureGrammar = native.ensureSyntaxGrammar;
      if (highlight === undefined) highlight = native.highlightString;
    }
    await ensureGrammar(lang);
    const result = await highlight(code, lang, themeName);
    if (!isWellFormedHighlightResult(result)) return null;
    return result;
  } catch {
    warnParserUnavailable();
    return null;
  }
}
