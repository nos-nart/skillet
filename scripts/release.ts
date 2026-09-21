#!/usr/bin/env bun
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { loadAppPackageMetadata, rootDir } from "./lib/apps";
import { getGitHubRepositorySlug } from "./lib/release";

interface ReleaseArgs {
  arch: "arm" | "x86" | "all";
  skipTests: boolean;
  skipBuild: boolean;
  publish: boolean;
  skipSign: boolean;
  skipNotarize: boolean;
  notes?: string;
  notesFile?: string;
  help: boolean;
}

function parseArgs(args: string[]): ReleaseArgs {
  const result: ReleaseArgs = {
    arch: "arm",
    skipTests: false,
    skipBuild: false,
    publish: false,
    skipSign: true,
    skipNotarize: true,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--arch=arm" || arg === "arm") {
      result.arch = "arm";
    } else if (arg === "--arch=x86" || arg === "x86") {
      result.arch = "x86";
    } else if (arg === "--arch=all" || arg === "all") {
      result.arch = "all";
    } else if (arg === "--publish") {
      result.publish = true;
    } else if (arg === "--skip-tests") {
      result.skipTests = true;
    } else if (arg === "--skip-build") {
      result.skipBuild = true;
    } else if (arg === "--sign") {
      result.skipSign = false;
      result.skipNotarize = false;
    } else if (arg.startsWith("--notes=")) {
      result.notes = arg.slice("--notes=".length);
    } else if (arg === "--notes" && i + 1 < args.length) {
      result.notes = args[++i];
    } else if (arg.startsWith("--notes-file=")) {
      result.notesFile = arg.slice("--notes-file=".length);
    } else if (arg === "--notes-file" && i + 1 < args.length) {
      result.notesFile = args[++i];
    }
  }

  return result;
}

const defaultPath = [
  "/opt/homebrew/bin",
  "/usr/local/bin",
  path.join(process.env.HOME || "", ".bun", "bin"),
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
].join(":");

const baseEnv = {
  ...process.env,
  PATH: process.env.PATH ? `${process.env.PATH}:${defaultPath}` : defaultPath,
};

function exec(cmd: string, args: string[], options: { cwd?: string; env?: Record<string, string | undefined> } = {}) {
  console.log(`\x1b[36m▶ ${cmd} ${args.join(" ")}\x1b[0m`);
  const proc = spawnSync(cmd, args, {
    cwd: options.cwd ?? rootDir,
    env: { ...baseEnv, ...options.env },
    stdio: "inherit",
  });
  if (proc.status !== 0) {
    console.error(`\x1b[31m✖ Failed: ${cmd} ${args.join(" ")}\x1b[0m`);
    process.exit(proc.status ?? 1);
  }
}

function printHelp() {
  console.log(`
\x1b[1m🍳 Skillet macOS Release Script\x1b[0m

Usage:
  bun run release [options]

Options:
  --arch=arm|x86|all   Target architecture (default: arm)
  --publish            Publish as a GitHub Release (requires 'gh' CLI)
  --sign               Enable Apple Developer ID signing & notarization
  --skip-tests         Skip running typecheck and Jest tests
  --skip-build         Skip rebuilding if archives already exist in dist/
  --notes=<text>       Custom release notes body
  --notes-file=<path>  Read release notes from a markdown file
  -h, --help           Show this help message

Examples:
  # 1. Build and package local Apple Silicon release (.zip and .app)
  bun run release

  # 2. Build for both Apple Silicon (arm) and Intel (x86)
  bun run release --arch=all

  # 3. Build, package, and publish directly to GitHub Releases
  bun run release --publish

  # 4. Skip build and publish already generated .zip
  bun run release --skip-build --publish
`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const pkg = loadAppPackageMetadata("skillet");
  const version = pkg.version;
  const repoSlug = getGitHubRepositorySlug();
  const distDir = path.join(rootDir, "dist", "skillet", "macos");
  const architectures = options.arch === "all" ? ["arm", "x86"] : [options.arch];
  const zipFiles = architectures.map((a) => path.join(distDir, `Skillet-${version}-${a}.zip`));

  console.log("\n\x1b[1m🍳 Skillet macOS Release v" + version + " (" + options.arch + ")\x1b[0m\n");

  // Step 1: Verification
  if (!options.skipTests) {
    console.log("\x1b[34m[1/3] Running tests and typechecks...\x1b[0m");
    exec("node", ["node_modules/typescript/bin/tsc", "--noEmit", "-p", "tsconfig.legend.json"]);
    exec("node", ["node_modules/jest/bin/jest.js", "--no-watchman", "--config", "apps/skillet/jest.config.cjs"]);
    console.log("\x1b[32m✔ All tests and typechecks passed!\x1b[0m\n");
  } else {
    console.log("\x1b[33m[1/3] Skipping tests (--skip-tests passed)\x1b[0m\n");
  }

  // Step 2: Packaging macOS App
  if (options.skipBuild) {
    console.log("\x1b[33m[2/3] Skipping build step (--skip-build passed)\x1b[0m");
    const missing = zipFiles.filter((f) => !fs.existsSync(f));
    if (missing.length > 0) {
      console.error(`\x1b[31m✖ Missing expected release archives for version ${version}:\x1b[0m`);
      for (const f of missing) {
        console.error(`    ${path.relative(rootDir, f)}`);
      }
      console.error("\nRun without --skip-build first to generate the archives.");
      process.exit(1);
    }
  } else {
    console.log("\x1b[34m[2/3] Building and packaging macOS app bundle...\x1b[0m");
    const packageArgs = [
      "scripts/package-macos-app.ts",
      "skillet",
      options.arch,
      "--skip-appcast",
    ];

    if (options.skipSign) {
      packageArgs.push("--skip-sign");
    }
    if (options.skipNotarize) {
      packageArgs.push("--skip-notarize");
    }

    exec("bun", packageArgs);
  }

  console.log("\n\x1b[32m✔ Release artifacts ready:\x1b[0m");
  for (const zip of zipFiles) {
    if (fs.existsSync(zip)) {
      const stats = fs.statSync(zip);
      const mb = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`  📦 ${path.relative(rootDir, zip)} (${mb} MB)`);
    }
  }

  // Step 3: GitHub Release
  if (options.publish) {
    console.log("\n\x1b[34m[3/3] Publishing release to GitHub (" + repoSlug + ")...\x1b[0m");

    // Verify gh CLI is installed
    const ghCheck = spawnSync("which", ["gh"], { env: baseEnv, encoding: "utf8" });
    if (ghCheck.status !== 0) {
      console.error("\n\x1b[31m✖ GitHub CLI (`gh`) was not found in your PATH.\x1b[0m");
      console.log("\nTo publish automatically, please install and log in to GitHub CLI:");
      console.log("  \x1b[36mbrew install gh\x1b[0m");
      console.log("  \x1b[36mgh auth login\x1b[0m");
      console.log("  \x1b[36mbun run release --skip-build --publish\x1b[0m\n");
      console.log("Or create the release manually on GitHub:");
      console.log(`  👉 \x1b[36mhttps://github.com/${repoSlug}/releases/new\x1b[0m\n`);
      console.log("Attach the file(s):");
      for (const zip of zipFiles) {
        console.log(`  - ${path.relative(rootDir, zip)}`);
      }
      process.exit(1);
    }

    const tagName = `v${version}`;
    const title = `Skillet v${version}`;
    let notes = options.notes;
    if (!notes && options.notesFile) {
      notes = fs.readFileSync(path.resolve(rootDir, options.notesFile), "utf8");
    }
    if (!notes) {
      notes = `## Skillet v${version}

Universal Skills & Prompts Manager for AI Coding Agents.

### Features & Updates:
- Native macOS desktop experience with Apple design aesthetics.
- Seamless per-repository skill activation switchboard.
- Space Grotesk and JetBrains Mono native typography.
- Refined codeblock rendering with syntax highlighting.
- Crisp vector brand logos for detected coding agents.
`;
    }

    exec("gh", [
      "release",
      "create",
      tagName,
      "--repo",
      repoSlug,
      "--title",
      title,
      "--notes",
      notes,
      ...zipFiles.filter((f) => fs.existsSync(f)),
    ]);

    console.log(`\n\x1b[32m🎉 Successfully published release ${tagName}!\x1b[0m`);
    console.log(`👉 https://github.com/${repoSlug}/releases/tag/${tagName}\n`);
  } else {
    console.log(`
\x1b[34m[3/3] Packaging complete!\x1b[0m

To test the application locally:
  \x1b[36mopen dist/skillet/macos/Skillet.app\x1b[0m

To publish this release to GitHub:
  \x1b[36mbun run release --skip-build --publish\x1b[0m

Or create a GitHub release manually in your browser:
  \x1b[36mhttps://github.com/${repoSlug}/releases/new\x1b[0m
  - Tag version: \x1b[1mv${version}\x1b[0m
  - Release title: \x1b[1mSkillet v${version}\x1b[0m
  - Attach: \x1b[1m${zipFiles.map((f) => path.relative(rootDir, f)).join(", ")}\x1b[0m
`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
