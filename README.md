<div align="center">
  <img src="assets/icon.png" width="128" height="128" alt="Skillet Logo" />
  <h1>Skillet</h1>
  <p><strong>Universal Skills & Prompts Manager for AI Coding Agents</strong></p>
  <p>A fast, native macOS desktop application to discover, install, inspect, and toggle AI agent skills across all your local projects.</p>
</div>

---

## 🍳 Overview

When working with modern AI coding assistants—like **Claude Code**, **Cursor**, **Gemini**, **Google Antigravity**, **GitHub Copilot**, **Windsurf**, or **OpenCode**—managing agent capabilities, prompt templates, and custom rules across multiple repositories is tedious.

**Skillet** solves this with a centralized, native macOS desktop manager. Instead of manually copying and maintaining `.cursor/skills`, `.claude/skills`, or `.gemini/skills` files across dozens of repos, Skillet gives you:
- A global catalog of all your installed skills.
- A per-repository activation switchboard that instantly symlinks skills into your active projects.
- One-click discovery and installation from open GitHub registries (like `skills.sh`).
- An interactive inspector with rich Markdown previews and syntax highlighting.

---

## ✨ Features

- 🔍 **Discover & Install**: Browse trending agent skills directly from GitHub or import from any Git URL.
- 🎛️ **Per-Repository Switchboard**: Turn skills on or off for individual workspaces with instant, live symlink updates.
- 📖 **Interactive Inspector**: Inspect skill files, prompt instructions, and tools with syntax-highlighted codeblocks.
- ✏️ **Built-in Editor**: Edit markdown descriptions and skill rules directly within the app.
- 🤖 **Multi-Agent Auto-Detection**: Automatically detects installed AI coding agents on your Mac and displays crisp vector brand badges.
- 🍎 **Native macOS Performance**: Built with React Native for macOS, featuring **Space Grotesk** typography, **JetBrains Mono** code formatting, and light/dark theme support.

---

## 🤖 Supported Coding Agents

Skillet automatically detects installed agents and manages skills in their standard configuration directories:

| Agent | Global / Workspace Directory | Status |
| :--- | :--- | :---: |
| **Claude Code** | `~/.claude/skills` / `.claude/skills` | ✅ Detected |
| **Cursor** | `~/.cursor/skills` / `.cursor/skills` | ✅ Detected |
| **Gemini CLI** | `~/.gemini/skills` / `.gemini/skills` | ✅ Detected |
| **Google Antigravity** | `~/.gemini/antigravity` / `.agents` | ✅ Detected |
| **GitHub Copilot** | `~/.github/skills` / `.github/skills` | ✅ Detected |
| **Windsurf** | `~/.windsurf/skills` / `.windsurf/skills` | ✅ Detected |
| **OpenCode** | `~/.opencode/skills` / `.opencode/skills` | ✅ Detected |
| **Open Skills Standard** | `~/.skills` / `.skills` | ✅ Detected |

---

## 🚀 Getting Started

### Prerequisites

To run or build Skillet locally, make sure your Mac has:
1. **macOS** (Apple Silicon or Intel)
2. **Xcode** (with Command Line Tools installed)
3. **Bun** (`curl -fsSL https://bun.sh/install | bash`)
4. **CocoaPods** (`brew install cocoapods`)

---

### Installation & Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/nos-nart/skillet.git
   cd skillet
   ```

2. **Install project dependencies:**
   ```bash
   bun install
   ```

3. **Start the development server and launch the macOS app:**
   ```bash
   # Starts the Metro bundler and opens the native Skillet macOS app
   bun run dev
   ```

4. **Useful Development Commands:**
   ```bash
   # Open the already-compiled debug macOS app directly
   bun run open

   # Run typechecks across all packages
   bun run typecheck

   # Run the full unit test suite (Jest)
   bun test

   # Re-install native CocoaPods if native pods or manifests change
   bun run skillet pods macos
   ```

---

## 📦 How to Build & Release

Skillet includes an automated release pipeline (`scripts/release.ts`) that runs verification, compiles a release-optimized macOS binary, packages it into a `.zip` archive, and helps you publish it to GitHub Releases.

### 1. Build and Package Locally

To package a production build on your machine:

```bash
bun run release
```

**What this does automatically:**
1. ✅ Runs TypeScript typechecking (`tsc`).
2. ✅ Runs all 12 Jest test suites (68 unit tests).
3. 📦 Compiles the standalone release `.app` bundle via Xcode.
4. 🗜️ Compresses the application into a distribution `.zip` in:
   ```
   dist/skillet/macos/Skillet-<version>-arm.zip
   ```

To test the newly built standalone app immediately:
```bash
open dist/skillet/macos/Skillet.app
```

---

### 2. Publishing a Release to GitHub

You have two simple options to publish your release to GitHub:

#### Option A: One-Command Publish (Recommended)
If you have the [GitHub CLI](https://cli.github.com/) installed (`brew install gh` and `gh auth login`):

```bash
bun run release --publish
```

If you already ran `bun run release` and just want to publish the generated `.zip` without rebuilding:
```bash
bun run release --skip-build --publish
```

#### Option B: Manual Upload via Web Browser
If you do not have the GitHub CLI installed, you can publish manually in seconds:
1. Open your browser to:
   **[https://github.com/nos-nart/skillet/releases/new](https://github.com/nos-nart/skillet/releases/new)**
2. Set **Tag version** to `v0.0.1` (or matching version in `apps/skillet/package.json`).
3. Set **Release title** to `Skillet v0.0.1`.
4. Drag and drop `dist/skillet/macos/Skillet-0.0.1-arm.zip` into the binaries box.
5. Click **Publish release**!

---

### ⚙️ Release Script Options

| Flag | Description |
| :--- | :--- |
| `--arch=arm` | Target Apple Silicon (M1/M2/M3/M4) *(default)* |
| `--arch=x86` | Target Intel Macs |
| `--arch=all` | Package separate `.zip` archives for both Apple Silicon and Intel |
| `--publish` | Automatically create the GitHub Release and upload assets |
| `--skip-build` | Skip rebuilding if `.zip` archives are already generated |
| `--skip-tests` | Skip running typechecks and Jest tests before packaging |
| `--notes="<text>"` | Provide custom release notes markdown inline |
| `--notes-file=<path>` | Read custom release notes from a file |
| `--sign` | Enable Apple Developer ID signing & notarization *(requires Apple Developer certs)* |

---

## 🏛️ Project Architecture

```
skillet/
├── apps/
│   └── skillet/              # React Native for macOS application
│       ├── src/
│       │   ├── components/   # UI components (SkillList, DiscoverTab, Inspector, etc.)
│       │   ├── services/     # Skills scanner, symlink manager, GitHub client
│       │   └── types.ts      # TypeScript interfaces for skills & agents
│       └── app.manifest.ts   # App metadata, bundle ID, version configuration
├── packages/
│   └── skills-fs/            # Standalone package for skill file I/O and symlinking
├── shell/
│   └── macos/                # Native macOS Xcode shell & AppKit bridge
├── scripts/
│   ├── release.ts            # Release automation runner
│   ├── package-macos-app.ts  # Xcode release bundling & archiving
│   └── run-app.ts            # Dev runner and Metro launcher
└── dist/                     # Generated release artifacts (.app and .zip)
```

---

## 📄 License

MIT © [nos-nart](https://github.com/nos-nart)
