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
const ROOT_DIR = path.resolve(SRC_DIR, "..");

export function validateRepoBuildAndWorkflowContracts(
  pkgJsonText: string,
  desktopConfigText: string,
  releaseWorkflowText: string,
): string[] {
  const errors: string[] = [];
  const pkg = JSON.parse(pkgJsonText) as {
    version?: string;
    engines?: { node?: string };
    scripts?: Record<string, string>;
  };
  const desktopConfig = JSON.parse(desktopConfigText) as { version?: string };

  if (pkg.version !== desktopConfig.version) {
    errors.push(
      `package.json version (${pkg.version}) does not match desktop.config.json version (${desktopConfig.version}).`,
    );
  }

  const nodeEngine = pkg.engines?.node ?? "";
  const match = /^>=\s*(\d+)\.(\d+)\.(\d+)$/.exec(nodeEngine.trim());
  if (!match) {
    errors.push(
      `package.json must set engines.node to a minimum semver range ">=26.12.1" (found ${JSON.stringify(nodeEngine)}).`,
    );
  } else {
    const major = Number(match[1]);
    const minor = Number(match[2]);
    const patch = Number(match[3]);
    const meetsMin =
      major > 26 || (major === 26 && (minor > 12 || (minor === 12 && patch >= 1)));
    if (!meetsMin) {
      errors.push(
        `package.json engines.node (${nodeEngine}) must require at least >=26.12.1 to include October 2026 Node.js security patches.`,
      );
    }
  }

  if (!/node-version-file:\s*["']?package\.json["']?/.test(releaseWorkflowText)) {
    errors.push(
      `.github/workflows/release.yml must use "node-version-file: package.json" in actions/setup-node so CI reads engines.node from package.json.`,
    );
  }
  if (/^\s*node-version:/m.test(releaseWorkflowText)) {
    errors.push(
      `.github/workflows/release.yml must not hardcode "node-version"; use "node-version-file: package.json" instead.`,
    );
  }

  const legacyPathMatch = /\b(scripts\/[\w./-]+|apps\/skillet\b|shell\/[\w./-]+|packages\/[\w./-]+)/.exec(
    releaseWorkflowText,
  );
  if (legacyPathMatch) {
    errors.push(
      `.github/workflows/release.yml references removed legacy monorepo path "${legacyPathMatch[1]}". Use root Spark scripts instead.`,
    );
  }

  const scripts = pkg.scripts ?? {};
  for (const runMatch of releaseWorkflowText.matchAll(/\bbun run ([a-zA-Z0-9:_-]+)/g)) {
    const scriptName = runMatch[1];
    if (!Object.prototype.hasOwnProperty.call(scripts, scriptName)) {
      errors.push(
        `.github/workflows/release.yml runs "bun run ${scriptName}", which is missing from package.json#scripts.`,
      );
    }
  }

  return errors;
}

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

test("package.json, desktop.config.json, and .github/workflows/release.yml satisfy Node >=26.12.1 and Spark CI guardrails", () => {
  const pkgJsonText = fs.readFileSync(path.join(ROOT_DIR, "package.json"), "utf8");
  const desktopConfigText = fs.readFileSync(path.join(ROOT_DIR, "desktop.config.json"), "utf8");
  const releaseWorkflowText = fs.readFileSync(
    path.join(ROOT_DIR, ".github/workflows/release.yml"),
    "utf8",
  );
  expect(
    validateRepoBuildAndWorkflowContracts(pkgJsonText, desktopConfigText, releaseWorkflowText),
  ).toEqual([]);
});

test("guardrail catches real past CI mistakes from commits 7032dcd and 5fe905b", () => {
  const pkgWithoutEngines = JSON.stringify({
    name: "skillet",
    version: "2.0.0",
    scripts: { typecheck: "tsc --noEmit", test: "jest", build: "spark build", doctor: "spark doctor" },
  });
  const desktopConfig = JSON.stringify({ version: "2.0.0" });
  const brokenWorkflow7032dcd = `
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Restore enriched-markdown native assets
        run: |
          SCRIPT="$(node -e "console.log(require.resolve('react-native-enriched-markdown/postinstall.mjs', { paths: ['apps/skillet'] }))")"
      - name: Package macOS App
        run: |
          bun scripts/package-macos-app.ts skillet arm --skip-sign --skip-notarize --skip-appcast
  `;
  const violations7032dcd = validateRepoBuildAndWorkflowContracts(
    pkgWithoutEngines,
    desktopConfig,
    brokenWorkflow7032dcd,
  );
  expect(violations7032dcd).toEqual(
    expect.arrayContaining([
      expect.stringContaining('package.json must set engines.node to a minimum semver range ">=26.12.1"'),
      expect.stringContaining('.github/workflows/release.yml must use "node-version-file: package.json"'),
      expect.stringContaining('.github/workflows/release.yml must not hardcode "node-version"'),
      expect.stringContaining('references removed legacy monorepo path'),
    ]),
  );
});
