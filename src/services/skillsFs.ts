import { setStringAsync } from "@legendapp/spark/clipboard";
import {
  getDirectory,
  list,
  mkdir,
  readText,
  remove,
  writeText as writeFileText,
} from "@legendapp/spark/files";
import { runCommand } from "@legendapp/spark/processes";

let cachedHomeDir: string | null = null;

export function validateSafeSlug(slug: string): boolean {
  if (!slug) return false;
  const t = slug.trim();
  if (t === "" || t === "." || t === "..") return false;
  if (t.includes("..") || t.includes("/") || t.includes("\\") || t.includes("\0")) return false;
  return /^[a-zA-Z0-9_.-]+$/.test(t);
}

export function hasParentTraversal(inputPath: string): boolean {
  return inputPath.split("/").some((segment) => segment === "..");
}

export function parseScanResult(json: string): string[] {
  const parsed: unknown = JSON.parse(json);
  if (!Array.isArray(parsed) || !parsed.every((entry) => typeof entry === "string")) {
    throw new Error("skills-fs: scanSkillsDir returned a non-string-array payload");
  }
  return parsed;
}

export async function resolveHomeDir(): Promise<string> {
  if (cachedHomeDir) return cachedHomeDir;
  try {
    const dataDir = await getDirectory("data");
    const libIdx = dataDir.indexOf("/Library/");
    if (libIdx > 0) {
      const resolved = dataDir.slice(0, libIdx);
      cachedHomeDir = resolved;
      return resolved;
    }
  } catch {
    // Fall back to process.env.HOME in Node/Jest environments.
  }
  const envHome = typeof process !== "undefined" ? process.env?.HOME : undefined;
  if (envHome && envHome.startsWith("/")) {
    const resolved = envHome.replace(/\/+$/, "");
    cachedHomeDir = resolved;
    return resolved;
  }
  const fallback = "/Users/shared";
  cachedHomeDir = fallback;
  return fallback;
}

export function __resetHomeDirCacheForTests(): void {
  cachedHomeDir = null;
}

export function expandTilde(inputPath: string, homeDir: string): string {
  if (inputPath === "~") return homeDir;
  if (inputPath.startsWith("~/")) return `${homeDir}/${inputPath.slice(2)}`;
  return inputPath;
}

function parentDirectory(absPath: string): string {
  const normalized = absPath.replace(/\/+$/, "");
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "/" : normalized.slice(0, idx);
}

function basename(absPath: string): string {
  const normalized = absPath.replace(/\/+$/, "");
  const idx = normalized.lastIndexOf("/");
  return idx < 0 ? normalized : normalized.slice(idx + 1);
}

export async function scanSkillsDir(dir: string): Promise<string[]> {
  const home = await resolveHomeDir();
  const absDir = expandTilde(dir, home);
  try {
    const entries = await list(absDir);
    return entries
      .filter((entry) => !entry.name.startsWith("."))
      .map((entry) => entry.path);
  } catch (err: unknown) {
    const code = (err as { code?: string } | null)?.code;
    if (code === "E_NOT_FOUND" || code === "ENOENT" || code === "ENOTDIR") {
      return [];
    }
    const msg = err instanceof Error ? err.message : String(err);
    if (/not found|no such file|does not exist/i.test(msg)) {
      return [];
    }
    throw err;
  }
}

export async function readSkillMd(targetPath: string): Promise<string> {
  const home = await resolveHomeDir();
  const absPath = expandTilde(targetPath, home);
  return readText(absPath);
}

export async function ensureDir(targetPath: string): Promise<boolean> {
  if (hasParentTraversal(targetPath)) {
    throw new Error(`Refusing path with parent traversal: ${targetPath}`);
  }
  const home = await resolveHomeDir();
  const absPath = expandTilde(targetPath, home);
  await mkdir(absPath, { recursive: true });
  return true;
}

export async function writeTextFile(targetPath: string, contents: string): Promise<boolean> {
  if (hasParentTraversal(targetPath)) {
    throw new Error(`Refusing path with parent traversal: ${targetPath}`);
  }
  const home = await resolveHomeDir();
  const absPath = expandTilde(targetPath, home);
  const parent = parentDirectory(absPath);
  await mkdir(parent, { recursive: true });
  await writeFileText(absPath, contents);
  return true;
}

export async function symlink(source: string, target: string): Promise<boolean> {
  const slug = basename(target);
  if (!validateSafeSlug(slug)) {
    throw new Error(`Unsafe skill target slug: ${slug}`);
  }
  const home = await resolveHomeDir();
  const absSource = expandTilde(source, home);
  const absTarget = expandTilde(target, home);
  const parent = parentDirectory(absTarget);
  await mkdir(parent, { recursive: true });
  try {
    await remove(absTarget, { recursive: true });
  } catch {
    // Ignore when target does not exist yet.
  }
  const res = await runCommand({
    target: { type: "executable", path: "/bin/ln" },
    args: ["-s", absSource, absTarget],
  });
  const exitCode = res.exit?.type === "exited" ? res.exit.code : -1;
  if (exitCode !== 0) {
    const errText =
      res.stderr instanceof Uint8Array
        ? new TextDecoder().decode(res.stderr).trim()
        : String(res.stderr ?? "");
    throw new Error(errText || `ln -s failed with exit code ${exitCode}`);
  }
  return true;
}

export async function unlink(target: string): Promise<boolean> {
  const slug = basename(target);
  if (!validateSafeSlug(slug)) {
    throw new Error(`Unsafe skill target slug: ${slug}`);
  }
  const home = await resolveHomeDir();
  const absTarget = expandTilde(target, home);
  try {
    await remove(absTarget, { recursive: true });
  } catch {
    // Ignore when target is already absent.
  }
  return true;
}

export async function copyText(text: string): Promise<boolean> {
  await setStringAsync(text);
  return true;
}
