<div align="center">
  <img src="assets/icon.png" width="128" height="128" alt="Skillet Logo" />
  <h1>Skillet</h1>
  <p><strong>Universal Skills & Prompts Manager for AI Coding Agents</strong></p>
  <p>A fast, native macOS desktop application built on Legend Spark to discover, install, inspect, and toggle AI agent skills across all your local projects.</p>
</div>

---

## Overview

When working with AI coding assistants such as **Claude Code**, **Cursor**, **Gemini**, **Google Antigravity**, **GitHub Copilot**, **Windsurf**, or **OpenCode**, managing agent capabilities and custom `SKILL.md` files across multiple repositories is tedious.

**Skillet** provides a centralized native macOS desktop manager:
- **Global skill catalog.** Inspect all installed skills across your machine in one place.
- **Per-repository switchboard.** Toggle skills on or off for individual workspaces with live symlink updates.
- **One-click discovery.** Search `skills.sh` or browse any GitHub repository and install directly into Global scope, a tracked workspace, or a custom folder.
- **Interactive inspector.** Preview `SKILL.md` documentation with syntax-highlighted code blocks and instant copy actions.

---

## Supported coding agents

Skillet detects installed agents and manages skills in their standard configuration directories:

| Agent | Global / Workspace Directory |
| :--- | :--- |
| **Claude Code** | `~/.claude/skills` / `.claude/skills` |
| **Cursor** | `~/.cursor/skills` / `.cursor/skills` |
| **Gemini CLI** | `~/.gemini/config/skills` / `.gemini/skills` |
| **Google Antigravity** | `~/.gemini/config/skills` / `.agents/skills` |
| **GitHub Copilot** | `~/.github/skills` / `.github/skills` |
| **Windsurf** | `~/.codeium/windsurf/skills` / `.windsurf/skills` |
| **OpenCode** | `~/.opencode/skills` / `.opencode/skills` |
| **Open Skills Standard** | `~/.skills` / `.skills` |

---

## Getting started

### Prerequisites

1. **macOS** (Apple Silicon or Intel)
2. **Bun** (`curl -fsSL https://bun.sh/install | bash`)
3. **Xcode** (optional for `spark dev`, required only when compiling standalone `.app` bundles with `spark build`)

### Installation and development

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/nos-nart/skillet.git
   cd skillet
   bun install
   ```

2. **Start the Legend Spark development runtime:**
   ```bash
   bun run dev
   ```
   This starts Metro and opens Skillet inside the prebuilt `SparkRunner.app` runtime without requiring a local Xcode build.

3. **Verification and build commands:**
   ```bash
   # Run TypeScript typechecking
   bun run typecheck

   # Run the Jest unit and guardrail test suite
   bun run test

   # Check Legend Spark dependency pins and project health
   bun run doctor

   # Build a standalone macOS .app bundle
   bun run build

   # Package a distributable archive
   bun run package
   ```

---

## Project structure

```
skillet/
├── App.tsx                   # Root component entry re-exporting src/App
├── index.ts                  # Expo / Spark root registration and CSS entry
├── desktop.config.json       # Legend Spark window and macOS bundle configuration
├── global.css                # Tailwind v4 + Uniwind light/dark theme tokens
├── src/
│   ├── App.tsx               # Three-pane macOS split layout and state orchestration
│   ├── Sidebar.tsx           # Workspace scope switcher and navigation sidebar
│   ├── SkillList.tsx         # Virtualized skill list with package grouping and filter
│   ├── SkillDetail.tsx       # Skill inspector, workspace symlink toggles, and Markdown view
│   ├── SkillCodeFence.tsx    # Syntax-highlighted code block renderer with copy action
│   ├── ResizeHandle.tsx      # 1pt hairline split divider with interactive drag zone
│   ├── dialogs.tsx           # Spring-animated install and uninstall modal sheets
│   ├── tabs/                 # DiscoverTab, AgentsTab, and SettingsTab views
│   └── services/             # Effect v4 services, Spark FS/settings adapters, and schemas
└── jest/                     # Jest mocks for Spark native modules and React Native
```

---

## License

MIT © [nos-nart](https://github.com/nos-nart)
