export interface SyntaxToken {
  startColumn: number;
  length: number;
  styleId: number;
}

export interface SyntaxLine {
  index: number;
  text: string;
  tokens: SyntaxToken[];
}

export interface SyntaxStyleEntry {
  id: number;
  foreground: string;
}

export interface SyntaxHighlightResult {
  lines: SyntaxLine[];
  styles: SyntaxStyleEntry[];
}

export type MarkdownSpan =
  | { type: "prose"; text: string }
  | { type: "fence"; lang: string; code: string };

export interface CodeFenceDeps {
  ensureGrammar?: (lang: string) => Promise<unknown>;
  highlight?: (code: string, lang: string, theme: string) => Promise<SyntaxHighlightResult>;
}

export function splitMarkdownFences(body: string): MarkdownSpan[] {
  const spans: MarkdownSpan[] = [];
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
const hostFlags = globalThis as { __DEV__?: boolean };

function warnParserUnavailable(): void {
  if (warnedParserUnavailable) return;
  warnedParserUnavailable = true;
  if (hostFlags.__DEV__ === true) {
    console.warn("[skillet] syntax parser failed, rendering plain code blocks.");
  }
}

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

const DARK_PLUS_STYLES: SyntaxStyleEntry[] = [
  { id: 1, foreground: "#6A9955" }, // comment
  { id: 2, foreground: "#CE9178" }, // string
  { id: 3, foreground: "#569CD6" }, // keyword
  { id: 4, foreground: "#B5CEA8" }, // number
  { id: 5, foreground: "#DCDCAA" }, // function / command
  { id: 6, foreground: "#4EC9B0" }, // type / key
];

const GITHUB_LIGHT_STYLES: SyntaxStyleEntry[] = [
  { id: 1, foreground: "#6A737D" }, // comment
  { id: 2, foreground: "#032F62" }, // string
  { id: 3, foreground: "#D73A49" }, // keyword
  { id: 4, foreground: "#005CC5" }, // number
  { id: 5, foreground: "#6F42C1" }, // function / command
  { id: 6, foreground: "#22863A" }, // type / key
];

const TOKEN_PATTERNS: { styleId: number; re: RegExp }[] = [
  { styleId: 1, re: /^(\/\/.*|#.*|--.*)/ },
  { styleId: 2, re: /^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/ },
  {
    styleId: 3,
    re: /^(?:import|export|from|const|let|var|function|return|async|await|if|else|for|while|switch|case|break|continue|new|try|catch|finally|throw|interface|type|class|extends|implements|true|false|null|undefined|def|fn|pub|struct|enum|match|use|mod|package|func|select|where|and|or|not|in|as|yield)\b/,
  },
  { styleId: 4, re: /^\b\d+(?:\.\d+)?\b/ },
  { styleId: 6, re: /^[A-Z][A-Za-z0-9_]*\b/ },
  { styleId: 5, re: /^[a-zA-Z_][a-zA-Z0-9_-]*(?=\s*\()/ },
];

function tokenizeLine(lineText: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let pos = 0;
  while (pos < lineText.length) {
    const slice = lineText.slice(pos);
    let matched = false;
    for (const { styleId, re } of TOKEN_PATTERNS) {
      const m = re.exec(slice);
      if (m && m[0].length > 0) {
        tokens.push({ startColumn: pos, length: m[0].length, styleId });
        pos += m[0].length;
        matched = true;
        break;
      }
    }
    if (!matched) {
      const word = /^[a-zA-Z0-9_]+/.exec(slice);
      pos += word ? word[0].length : 1;
    }
  }
  return tokens;
}

export function tokenizeSyntax(code: string, _lang: string, themeName: string): SyntaxHighlightResult {
  const rawLines = code.split("\n");
  const lines: SyntaxLine[] = rawLines.map((text, index) => ({
    index,
    text,
    tokens: tokenizeLine(text),
  }));
  const styles = themeName === "dark-plus" ? DARK_PLUS_STYLES : GITHUB_LIGHT_STYLES;
  return { lines, styles };
}

const highlightCache = new Map<string, SyntaxHighlightResult>();
const ensuredGrammars = new Set<string>();
const inFlightRequests = new Map<string, Promise<SyntaxHighlightResult | null>>();

export function getCachedHighlight(
  code: string,
  lang: string,
  themeName: string,
): SyntaxHighlightResult | undefined {
  return highlightCache.get(`${lang}:${themeName}:${code}`);
}

export function clearHighlightCache(): void {
  highlightCache.clear();
  ensuredGrammars.clear();
  inFlightRequests.clear();
}

export async function highlightFence(
  code: string,
  lang: string,
  themeName: string,
  deps: CodeFenceDeps = {},
): Promise<SyntaxHighlightResult | null> {
  if (lang === "") return null;
  const cacheKey = `${lang}:${themeName}:${code}`;
  const cached = highlightCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight !== undefined) return inFlight;

  const promise = (async (): Promise<SyntaxHighlightResult | null> => {
    try {
      const ensureGrammar = deps.ensureGrammar ?? (async () => undefined);
      const highlight =
        deps.highlight ?? (async (src: string, l: string, t: string) => tokenizeSyntax(src, l, t));
      if (deps.ensureGrammar !== undefined || !ensuredGrammars.has(lang)) {
        await ensureGrammar(lang);
        ensuredGrammars.add(lang);
      }
      const result = await highlight(code, lang, themeName);
      if (!isWellFormedHighlightResult(result)) return null;
      highlightCache.set(cacheKey, result);
      return result;
    } catch {
      warnParserUnavailable();
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
}
