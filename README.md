<div align="center">
  <img src="public/icon.png" width="128" height="128" alt="Skillet Logo" />
  <h1>Skillet</h1>
  <p><strong>Universal Skills & Prompts Manager for AI Coding Agents</strong></p>
</div>

Skillet is a desktop application designed to discover, install, and manage AI agent skills and prompts across multiple AI coding assistants. 

Rather than copying and pasting `.cursorrules` or `.gemini` configurations between projects, Skillet allows you to install skills globally and instantly symlink them into specific workspaces using a per-repository switchboard.

## Features

- 🔍 **Discover**: Browse the open agent skills ecosystem directly from GitHub repositories (e.g., `skills.sh`).
- ⬇️ **Universal Installer**: Intelligently routes skills to their native agent directories (`.cursor/skills`, `.gemini/config/skills`, etc.) based on the source repository.
- 🎛️ **Per-Repository Switchboard**: Toggle skills on or off for individual workspaces. Skillet automatically manages the symlinks in your project's `.agents`, `.cursor`, or `.gemini` folders.
- 📖 **Live Documentation**: View rich Markdown previews (with syntax highlighting) of the tools and prompts a skill provides before activating it.

## Supported Agents

Skillet automatically detects your installed agents and routes skills to their standard directories:

- **Cursor** (`.cursor/skills`)
- **Gemini / Antigravity** (`.gemini/skills`)
- **Claude Code** (`.claude/skills`)
- **Windsurf** (`.windsurf/skills`)
- **GitHub Copilot** (`.github/skills`)
- **OpenCode** (`.opencode/skills`)
- **Generic Open Skills** (`.skills`)

## Getting Started

Skillet is built entirely on the modern [Deno](https://deno.com) stack, using React 19 and Tailwind CSS v4.

### Prerequisites
- [Deno](https://deno.land/) installed on your machine.

### Commands

```bash
# Clone the repository
git clone https://github.com/your-username/skillet.git
cd skillet

# Run the web development server (Vite)
deno task dev

# Run the native Desktop Application (using Deno Desktop)
deno task desktop

# Build a standalone macOS .app bundle
deno task desktop:app
```

## Tech Stack

- **Runtime & Desktop**: Deno & `deno desktop`
- **Frontend**: React 19 (via Vite)
- **Styling**: Tailwind CSS v4
- **Components**: Radix UI & Phosphor Icons
- **Markdown Processing**: Comark & Shiki
