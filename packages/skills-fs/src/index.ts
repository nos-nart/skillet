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
export function scanSkillsDir(dir: string): Promise<string[]> {
  return NativeSkillsFs.scanSkillsDir(dir).then((json) => JSON.parse(json) as string[]);
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

export { default as NativeSkillsFs } from "./NativeSkillsFs";
