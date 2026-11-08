import * as fs from "fs";
import * as path from "path";

function walkTsFiles(dir: string, includeTests = false): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!includeTests && entry.name === "__tests__") continue;
      out.push(...walkTsFiles(full, includeTests));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name)) {
      if (entry.name === "macosGuardrails.test.ts") continue;
      out.push(full);
    }
  }
  return out;
}

const SRC_DIR = path.resolve(__dirname, "..");

test("no source or test file imports legacy @legend-apps/* or @skillet/skills-fs packages", () => {
  const files = walkTsFiles(SRC_DIR, true);
  const offenders: string[] = [];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    if (/@legend-apps\/|@skillet\/skills-fs/.test(src)) {
      offenders.push(path.relative(SRC_DIR, file));
    }
  }
  expect(offenders).toEqual([]);
});

test("no TSX component uses RN Modal, Dimensions.get, or className on Animated.View", () => {
  const files = walkTsFiles(SRC_DIR).filter((f) => f.endsWith(".tsx"));
  const violations: string[] = [];
  for (const file of files) {
    const rel = path.relative(SRC_DIR, file);
    const src = fs.readFileSync(file, "utf8");
    const stripped = src.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
    if (/\bModal\b/.test(stripped)) {
      violations.push(`${rel}: Do not use react-native Modal on macOS Fabric (causes SIGSEGV). Use DialogShell in src/dialogs.tsx.`);
    }
    if (/\bDimensions\.get\b/.test(stripped)) {
      violations.push(`${rel}: Do not call Dimensions.get on macOS (throws "No dimension set"). Use explicit pane state.`);
    }
    if (/<Animated\.View[^>]*\bclassName=/.test(stripped)) {
      violations.push(`${rel}: Do not pass className to Animated.View (Uniwind ignores unwrapped Animated.View). Use style with useThemePalette().`);
    }
  }
  expect(violations).toEqual([]);
});
