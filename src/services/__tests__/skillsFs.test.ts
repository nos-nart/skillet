import {
  __resetHomeDirCacheForTests,
  copyText,
  ensureDir,
  expandTilde,
  parseScanResult,
  readSkillMd,
  resolveHomeDir,
  scanSkillsDir,
  symlink,
  unlink,
  validateSafeSlug,
  writeTextFile,
} from "../skillsFs";

const sparkMocks = require("../../../jest/sparkMocks.cjs");

beforeEach(() => {
  __resetHomeDirCacheForTests();
  sparkMocks.__setMockFs({
    dirs: ["/Users/test/.skills", "/Users/test/.skills/eli5"],
    files: {
      "/Users/test/.skills/eli5/SKILL.md": "---\nname: eli5\n---\nBody",
      "/Users/test/.skills/.DS_Store": "hidden",
    },
  });
  sparkMocks.__resetCommandCalls();
});

test("parses a JSON string array", () => {
  expect(parseScanResult('["/a","/b"]')).toEqual(["/a", "/b"]);
});

test("rejects non-array and non-string payloads", () => {
  expect(() => parseScanResult('{"a":1}')).toThrow();
  expect(() => parseScanResult("[1,2]")).toThrow();
});

test("resolves home directory from Spark data directory", async () => {
  await expect(resolveHomeDir()).resolves.toBe("/Users/test");
  expect(expandTilde("~/.skills", "/Users/test")).toBe("/Users/test/.skills");
  expect(expandTilde("~", "/Users/test")).toBe("/Users/test");
  expect(expandTilde("/abs/path", "/Users/test")).toBe("/abs/path");
});

test("scans non-hidden entries and expands tilde", async () => {
  const entries = await scanSkillsDir("~/.skills");
  expect(entries).toEqual(["/Users/test/.skills/eli5"]);
});

test("returns empty array when directory does not exist", async () => {
  await expect(scanSkillsDir("~/.nonexistent")).resolves.toEqual([]);
});

test("reads SKILL.md with tilde expansion", async () => {
  await expect(readSkillMd("~/.skills/eli5/SKILL.md")).resolves.toContain("name: eli5");
});

test("rejects parent traversal on ensureDir and writeTextFile", async () => {
  await expect(ensureDir("~/.skills/../evil")).rejects.toThrow("parent traversal");
  await expect(writeTextFile("~/.skills/../evil/SKILL.md", "bad")).rejects.toThrow("parent traversal");
});

test("writes text file and creates parent directory", async () => {
  await expect(writeTextFile("~/.skills/new-skill/SKILL.md", "# New")).resolves.toBe(true);
  await expect(readSkillMd("~/.skills/new-skill/SKILL.md")).resolves.toBe("# New");
});

test("creates and removes symlink using /bin/ln -s", async () => {
  await expect(
    symlink("~/.skills/eli5", "/Users/test/repo/.agents/skills/eli5"),
  ).resolves.toBe(true);
  expect(sparkMocks.__getCommandCalls()).toEqual([
    {
      target: { type: "executable", path: "/bin/ln" },
      args: ["-s", "/Users/test/.skills/eli5", "/Users/test/repo/.agents/skills/eli5"],
    },
  ]);
  await expect(unlink("/Users/test/repo/.agents/skills/eli5")).resolves.toBe(true);
});

test("rejects unsafe slugs in symlink and unlink", async () => {
  expect(validateSafeSlug("eli5")).toBe(true);
  expect(validateSafeSlug("..")).toBe(false);
  expect(validateSafeSlug("bad slug")).toBe(false);
  await expect(symlink("/src", "/target/..")).rejects.toThrow("Unsafe skill target slug");
  await expect(unlink("/target/bad slug")).rejects.toThrow("Unsafe skill target slug");
});

test("copies text via Spark clipboard", async () => {
  await expect(copyText("copied snippet")).resolves.toBe(true);
  expect(sparkMocks.__getClipboardText()).toBe("copied snippet");
});
