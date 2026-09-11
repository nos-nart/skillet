import {
  highlightFence,
  splitMarkdownFences,
  syntaxThemeForAppearance,
} from "../codeFence";

// The warn-once test is titled "in dev": the module only calls
// console.warn when the RN __DEV__ global is truthy, and __DEV__ is absent
// under jest — so simulate a dev host. Read at call time by the module.
Object.assign(globalThis, { __DEV__: true });

test("splits prose and fenced blocks with languages", () => {
  const spans = splitMarkdownFences("# T\n\n```ts\nconst a = 1;\n```\n\ndone\n");
  expect(spans).toEqual([
    { type: "prose", text: "# T\n\n" },
    { type: "fence", lang: "ts", code: "const a = 1;" },
    { type: "prose", text: "\n\ndone\n" },
  ]);
});

test("leaves unclosed fences as prose so no content hides", () => {
  const spans = splitMarkdownFences("before\n```ts\nconst a = 1;\n");
  expect(spans).toEqual([{ type: "prose", text: "before\n```ts\nconst a = 1;\n" }]);
});

test("returns the whole body as one prose span when fenceless", () => {
  expect(splitMarkdownFences("just text")).toEqual([{ type: "prose", text: "just text" }]);
});

test("maps appearance to bundled theme names", () => {
  expect(syntaxThemeForAppearance("dark")).toBe("dark-plus");
  expect(syntaxThemeForAppearance("light")).toBe("github-light");
});

test("warns once in dev when the parser is unavailable", async () => {
  // Runs before the other failure tests: the module warns only once.
  const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  const failing = {
    ensureGrammar: jest.fn().mockRejectedValue(new Error("offline")),
    highlight: jest.fn(),
  };
  await highlightFence("a", "ts", "dark-plus", failing);
  await highlightFence("b", "ts", "dark-plus", failing);
  expect(warn).toHaveBeenCalledTimes(1);
  warn.mockRestore();
});

test("highlightFence returns null for empty language without touching native", async () => {
  const highlight = jest.fn();
  await expect(highlightFence("code", "", "dark-plus", { highlight })).resolves.toBeNull();
  expect(highlight).not.toHaveBeenCalled();
});

test("highlightFence returns null when grammar install fails", async () => {
  const ensureGrammar = jest.fn().mockRejectedValue(new Error("offline"));
  const highlight = jest.fn();
  await expect(
    highlightFence("code", "ts", "dark-plus", { ensureGrammar, highlight }),
  ).resolves.toBeNull();
  expect(highlight).not.toHaveBeenCalled();
});

test("highlightFence returns null when highlighting throws", async () => {
  const ensureGrammar = jest.fn().mockResolvedValue(undefined);
  const highlight = jest.fn().mockRejectedValue(new Error("no grammar"));
  await expect(
    highlightFence("code", "ts", "dark-plus", { ensureGrammar, highlight }),
  ).resolves.toBeNull();
  expect(highlight).toHaveBeenCalledWith("code", "ts", "dark-plus");
});

test("highlightFence returns token runs on success", async () => {
  const ensureGrammar = jest.fn().mockResolvedValue(undefined);
  const result = { lines: [], styles: [] };
  const highlight = jest.fn().mockResolvedValue(result);
  await expect(
    highlightFence("code", "ts", "dark-plus", { ensureGrammar, highlight }),
  ).resolves.toBe(result);
  expect(highlight).toHaveBeenCalledWith("code", "ts", "dark-plus");
});
