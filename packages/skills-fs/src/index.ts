import NativeSkillsFs from "./NativeSkillsFs";

export function validateSafeSlug(slug: string): boolean {
  if (!slug) return false;
  const t = slug.trim();
  if (t === "" || t === "." || t === "..") return false;
  if (t.includes("..") || t.includes("/") || t.includes("\\") || t.includes("\0")) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(t);
}

// Contract: native `scanSkillsDir` returns a JSON string (string[] encoded);
// the façade parses it to `string[]` (file-dialog pattern) for Task 3 consumers.
// Pure so the payload shape stays unit-testable without the native runtime.
export function parseScanResult(json: string): string[] {
  // SAFETY: native `scanSkillsDir` resolves with a JSON-encoded array of path
  // strings (`jsonStringFromObject:` over an `NSMutableArray<NSString *>`);
  // anything else is a bridge contract violation, so throw loudly.
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
    throw new Error("skills-fs: scanSkillsDir returned a non-string-array payload");
  }
  return parsed;
}

export function scanSkillsDir(dir: string): Promise<string[]> {
  return NativeSkillsFs.scanSkillsDir(dir).then((json) => parseScanResult(json));
}

export function readSkillMd(path: string): Promise<string> {
  return NativeSkillsFs.readSkillMd(path);
}

export function symlink(source: string, target: string): Promise<boolean> {
  return NativeSkillsFs.symlink(source, target);
}

export function unlink(target: string): Promise<boolean> {
  return NativeSkillsFs.unlink(target);
}

// Install surface for Task 7 `downloadSkill`: like `scanSkillsDir`/`readSkillMd`
// these expand `~` natively (RNSkillsFs.mm `stringByExpandingTildeInPath`), so
// callers may pass tilde-prefixed targets such as `~/.skills/<owner>/<slug>`.
// Unlike `symlink`/`unlink` (absolute-only), expansion here is safe: the native
// side rejects paths containing `..`, and the service layer validates the slug.
export function ensureDir(path: string): Promise<boolean> {
  return NativeSkillsFs.ensureDir(path);
}

export function writeTextFile(path: string, contents: string): Promise<boolean> {
  return NativeSkillsFs.writeTextFile(path, contents);
}

// Clipboard for the Prompts tab copy buttons (old `navigator.clipboard`).
export function copyText(text: string): Promise<boolean> {
  return NativeSkillsFs.copyText(text);
}

export { default as NativeSkillsFs } from "./NativeSkillsFs";
