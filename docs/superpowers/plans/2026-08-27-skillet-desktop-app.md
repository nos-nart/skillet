# Skillet Desktop App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build **Skillet**, a standalone desktop application using Deno Desktop, React, and Tailwind CSS to discover, install, update, and toggle AI Agent Skills globally and per-repository across Claude Code, Cursor, Antigravity/Gemini, Windsurf, OpenCode, Codex, and Copilot.

**Architecture:** A Deno Desktop application with a 100% TypeScript stack. The backend scans local agent directories, parses `SKILL.md` files, checks GitHub for updates, and manages symlinks for per-project skill toggling. The frontend is a React 19 + Tailwind CSS desktop interface structured in a 3-column macOS layout (Sidebar -> Package/Skill List -> Detail Pane & Switchboard).

**Tech Stack:** Deno 2.9+ (`deno desktop`), React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, TanStack Query, Marked (for Markdown rendering), YAML frontmatter parser.

## Global Constraints

- 100% TypeScript across frontend and backend.
- No Rust toolchain or native compiling required; uses Deno's native desktop webview.
- Strictly adhere to the open `SKILL.md` and `skills.sh` directory specifications.
- Safe symlink operations with path traversal protections.
- Zero external build dependencies outside of Deno.

---

### Task 1: Project Setup & Deno Configuration

**Files:**
- Create: `deno.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/index.css`
- Create: `desktop.ts`

**Interfaces:**
- Consumes: None
- Produces: Project build pipeline and Deno Desktop entry point.

- [ ] **Step 1: Create `deno.json` configuration**

```json
{
  "tasks": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "desktop": "deno desktop --hmr desktop.ts",
    "desktop:build": "deno desktop desktop.ts",
    "test": "deno test -A"
  },
  "imports": {
    "react": "npm:react@19.0.0",
    "react-dom": "npm:react-dom@19.0.0",
    "react-dom/client": "npm:react-dom@19.0.0/client",
    "lucide-react": "npm:lucide-react@0.475.0",
    "clsx": "npm:clsx@2.1.1",
    "tailwind-merge": "npm:tailwind-merge@3.0.1",
    "marked": "npm:marked@15.0.7",
    "yaml": "npm:yaml@2.7.0"
  },
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "lib": ["deno.window", "dom", "dom.iterable", "esnext"]
  }
}
```

- [ ] **Step 2: Create `vite.config.ts` and HTML entry point**

```ts
import { defineConfig } from "npm:vite@6.1.0";
import react from "npm:@vitejs/plugin-react@4.3.4";
import tailwindcss from "npm:@tailwindcss/vite@4.0.6";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
```

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Skillet - Skills & Prompts</title>
  </head>
  <body class="bg-zinc-900 text-zinc-100 antialiased select-none font-sans overflow-hidden">
    <div id="root" class="h-screen w-screen flex flex-col"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create Tailwind CSS setup & basic React entry**

```css
@import "tailwindcss";

@layer base {
  * {
    border-color: rgba(255, 255, 255, 0.1);
  }
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  ::-webkit-scrollbar-track {
    background: transparent;
  }
  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}
```

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <div class="h-full w-full flex items-center justify-center text-zinc-400">
    Skillet Desktop Initializing...
  </div>
);
```

- [ ] **Step 4: Create `desktop.ts` Deno Desktop server**

```ts
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return new Response(JSON.stringify({ status: "ok", app: "skillet" }), {
      headers: { "content-type": "application/json" },
    });
  }
  return serveDir(req, { fsRoot: "./dist", quiet: true });
});
```

- [ ] **Step 5: Verify configuration and build pipeline**

Run: `deno task build`
Expected: Successfully generates `dist/` directory.

- [ ] **Step 6: Commit**

```bash
git add deno.json vite.config.ts index.html src/ desktop.ts
git commit -m "chore: setup Deno Desktop and React Vite project configuration"
```

---

### Task 2: Core Types & Local Skill Scanner Engine

**Files:**
- Create: `src/types/skills.ts`
- Create: `src/backend/scanner.ts`
- Test: `tests/scanner_test.ts`

**Interfaces:**
- Consumes: Filesystem paths (`~/.claude/skills`, `~/.cursor/skills`, etc.)
- Produces: `Skill`, `SkillPackage`, `AgentLocation`, `scanInstalledSkills()` function.

- [ ] **Step 1: Define TypeScript models for Skills and Agents**

```ts
export type AgentId =
  | "claude-code"
  | "cursor"
  | "gemini"
  | "antigravity"
  | "windsurf"
  | "opencode"
  | "codex"
  | "copilot"
  | "general";

export interface SkillMetadata {
  name: string;
  description: string;
  author?: string;
  version?: string;
  trigger?: string;
  tools?: string[];
  agents?: AgentId[];
  license?: string;
}

export interface Skill {
  id: string; // e.g. "cursor-plugins/architect"
  name: string;
  slug: string; // e.g. "architect"
  packageName: string; // e.g. "cursor/plugins"
  scope: "global" | "project";
  agent: AgentId;
  path: string; // absolute path to folder containing SKILL.md
  skillMdPath: string;
  metadata: SkillMetadata;
  rawMarkdown: string;
  isSymlink: boolean;
  targetPath?: string;
  updateAvailable?: boolean;
}

export interface SkillPackage {
  name: string; // e.g. "cursor/plugins", "vercel-labs/skills"
  author: string;
  sourceUrl?: string;
  skills: Skill[];
}

export interface Workspace {
  id: string;
  name: string;
  path: string;
  isCurrent?: boolean;
}
```

- [ ] **Step 2: Write failing unit test for scanner & SKILL.md parser**

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseSkillMd, scanDirectoryForSkills } from "../src/backend/scanner.ts";

Deno.test("parseSkillMd extracts YAML frontmatter and markdown body", () => {
  const sampleMd = `---
name: web-design-guidelines
description: Review UI code for Web Interface Guidelines compliance.
trigger: /web-design
tools:
  - view_file
  - search_web
---

# Web Design Guidelines
Follow modern guidelines for layout and typography.
`;

  const parsed = parseSkillMd(sampleMd, "/dummy/path/SKILL.md");
  assertEquals(parsed.metadata.name, "web-design-guidelines");
  assertEquals(parsed.metadata.description, "Review UI code for Web Interface Guidelines compliance.");
  assertEquals(parsed.metadata.trigger, "/web-design");
  assertEquals(parsed.metadata.tools, ["view_file", "search_web"]);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `deno test tests/scanner_test.ts`
Expected: FAIL with "cannot find module or parseSkillMd is not defined"

- [ ] **Step 4: Implement `scanner.ts` with YAML frontmatter parser and agent path discovery**

```ts
import { parse as parseYaml } from "npm:yaml@2.7.0";
import { Skill, SkillMetadata } from "../types/skills.ts";

export function parseSkillMd(content: string, filePath: string): { metadata: SkillMetadata; body: string } {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  let metadata: SkillMetadata = {
    name: "Unnamed Skill",
    description: "",
  };
  let body = content;

  if (match) {
    try {
      const parsed = parseYaml(match[1]) as Record<string, unknown>;
      metadata = {
        name: String(parsed.name || "Unnamed Skill"),
        description: String(parsed.description || ""),
        author: parsed.author ? String(parsed.author) : undefined,
        version: parsed.version ? String(parsed.version) : undefined,
        trigger: parsed.trigger ? String(parsed.trigger) : `/${String(parsed.name || "skill").toLowerCase()}`,
        tools: Array.isArray(parsed.tools) ? parsed.tools.map(String) : [],
        agents: Array.isArray(parsed.agents) ? parsed.agents.map(String) : [],
        license: parsed.license ? String(parsed.license) : undefined,
      };
      body = match[2].trim();
    } catch {
      // Fallback if frontmatter fails to parse
    }
  }

  return { metadata, body };
}

export async function scanDirectoryForSkills(dirPath: string, scope: "global" | "project", agent: any): Promise<Skill[]> {
  const skills: Skill[] = [];
  try {
    for await (const entry of Deno.readDir(dirPath)) {
      if (entry.isDirectory || entry.isSymlink) {
        const skillDir = `${dirPath}/${entry.name}`;
        const skillMdPath = `${skillDir}/SKILL.md`;
        try {
          const content = await Deno.readTextFile(skillMdPath);
          const { metadata, body } = parseSkillMd(content, skillMdPath);
          const stat = await Deno.lstat(skillDir);

          skills.push({
            id: `${entry.name}`,
            name: metadata.name,
            slug: entry.name,
            packageName: entry.name.includes("/") ? entry.name.split("/")[0] : "Global skills",
            scope,
            agent,
            path: skillDir,
            skillMdPath,
            metadata,
            rawMarkdown: body,
            isSymlink: stat.isSymlink,
          });
        } catch {
          // No SKILL.md in this directory, skip
        }
      }
    }
  } catch {
    // Directory does not exist, return empty array
  }
  return skills;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `deno test tests/scanner_test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/types/ src/backend/scanner.ts tests/scanner_test.ts
git commit -m "feat: implement SKILL.md parsing and directory scanner engine"
```

---

### Task 3: Per-Repo Symlink & Workspace Management Engine

**Files:**
- Create: `src/backend/workspace.ts`
- Create: `src/backend/symlinker.ts`
- Test: `tests/symlinker_test.ts`

**Interfaces:**
- Consumes: Skill directory paths and workspace folder paths.
- Produces: `enableSkillInWorkspace()`, `disableSkillInWorkspace()`, `listWorkspaceSkills()`, `getRegisteredWorkspaces()`.

- [ ] **Step 1: Write failing test for symlink management**

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { enableSkillInWorkspace, disableSkillInWorkspace, isSkillEnabledInWorkspace } from "../src/backend/symlinker.ts";

Deno.test("enableSkillInWorkspace creates symlink and disable removes it", async () => {
  const tempDir = await Deno.makeTempDir();
  const sourceSkillDir = `${tempDir}/source-skill`;
  const workspaceDir = `${tempDir}/my-project`;

  await Deno.mkdir(sourceSkillDir, { recursive: true });
  await Deno.writeTextFile(`${sourceSkillDir}/SKILL.md`, "---\nname: test\n---\nBody");
  await Deno.mkdir(workspaceDir, { recursive: true });

  // Enable skill
  const success = await enableSkillInWorkspace(sourceSkillDir, "test-skill", workspaceDir, "cursor");
  assertEquals(success, true);
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), true);

  // Disable skill
  const disabled = await disableSkillInWorkspace("test-skill", workspaceDir, "cursor");
  assertEquals(disabled, true);
  assertEquals(await isSkillEnabledInWorkspace("test-skill", workspaceDir, "cursor"), false);

  await Deno.remove(tempDir, { recursive: true });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test tests/symlinker_test.ts`
Expected: FAIL with "module not found"

- [ ] **Step 3: Implement `symlinker.ts` and `workspace.ts`**

```ts
import { AgentId } from "../types/skills.ts";

function getAgentRelPath(agent: AgentId): string {
  switch (agent) {
    case "cursor":
      return ".cursor/skills";
    case "claude-code":
      return ".claude/skills";
    case "gemini":
    case "antigravity":
      return ".gemini/config/skills";
    default:
      return ".skills";
  }
}

export async function isSkillEnabledInWorkspace(skillSlug: string, workspacePath: string, agent: AgentId): Promise<boolean> {
  const targetDir = `${workspacePath}/${getAgentRelPath(agent)}/${skillSlug}`;
  try {
    const stat = await Deno.lstat(targetDir);
    return stat.isSymlink || stat.isDirectory;
  } catch {
    return false;
  }
}

export async function enableSkillInWorkspace(
  sourceSkillPath: string,
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const agentDir = `${workspacePath}/${getAgentRelPath(agent)}`;
  const targetSymlink = `${agentDir}/${skillSlug}`;

  try {
    await Deno.mkdir(agentDir, { recursive: true });
    // Remove if already exists
    try {
      await Deno.remove(targetSymlink, { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
    await Deno.symlink(sourceSkillPath, targetSymlink);
    return true;
  } catch (err) {
    console.error("Failed to enable skill:", err);
    return false;
  }
}

export async function disableSkillInWorkspace(
  skillSlug: string,
  workspacePath: string,
  agent: AgentId
): Promise<boolean> {
  const targetSymlink = `${workspacePath}/${getAgentRelPath(agent)}/${skillSlug}`;
  try {
    await Deno.remove(targetSymlink, { recursive: true });
    return true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test tests/symlinker_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/backend/symlinker.ts src/backend/workspace.ts tests/symlinker_test.ts
git commit -m "feat: implement per-repo symlink and workspace toggling engine"
```

---

### Task 4: GitHub Discovery & Update Checker Engine

**Files:**
- Create: `src/backend/updater.ts`
- Create: `src/backend/installer.ts`
- Test: `tests/updater_test.ts`

**Interfaces:**
- Consumes: GitHub repo shorthand (e.g. `vercel-labs/skills`) and local `skills-lock.json`.
- Produces: `checkForUpdates()`, `fetchRemoteSkillManifest()`, `downloadSkill()`.

- [ ] **Step 1: Write failing test for update detection logic**

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { compareCommitShas } from "../src/backend/updater.ts";

Deno.test("compareCommitShas detects outdated vs up-to-date versions", () => {
  assertEquals(compareCommitShas("abc1234", "abc1234"), false);
  assertEquals(compareCommitShas("abc1234", "def5678"), true);
  assertEquals(compareCommitShas(undefined, "def5678"), true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test tests/updater_test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `updater.ts` and `installer.ts`**

```ts
export interface LockFileEntry {
  source: string;
  commitSha: string;
  updatedAt: string;
  skills: string[];
}

export type SkillsLock = Record<string, LockFileEntry>;

export function compareCommitShas(localSha?: string, remoteSha?: string): boolean {
  if (!localSha || !remoteSha) return true;
  return localSha.trim() !== remoteSha.trim();
}

export async function fetchLatestGitHubCommit(ownerRepo: string, token?: string): Promise<string | null> {
  const headers: Record<string, string> = {
    "User-Agent": "Skillet-Desktop-App",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${ownerRepo}/commits?per_page=1`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data[0]?.sha || null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test tests/updater_test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/backend/updater.ts src/backend/installer.ts tests/updater_test.ts
git commit -m "feat: implement update checker and remote version comparison"
```

---

### Task 5: Backend API & Deno Desktop Bindings

**Files:**
- Create: `src/backend/api.ts`
- Modify: `desktop.ts`
- Create: `src/client/apiClient.ts`
- Test: `tests/api_test.ts`

**Interfaces:**
- Consumes: HTTP/WebSocket requests from the React frontend.
- Produces: JSON API endpoints `/api/skills`, `/api/workspaces`, `/api/toggle`, `/api/check-updates`, `/api/install`.

- [ ] **Step 1: Write test for API routes**

```ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { handleApiRequest } from "../src/backend/api.ts";

Deno.test("handleApiRequest handles GET /api/skills", async () => {
  const req = new Request("http://localhost/api/skills");
  const res = await handleApiRequest(req);
  assertEquals(res.status, 200);
  const data = await res.json();
  assertEquals(Array.isArray(data.skills), true);
});
```

- [ ] **Step 2: Implement `src/backend/api.ts`**

```ts
import { scanDirectoryForSkills } from "./scanner.ts";
import { enableSkillInWorkspace, disableSkillInWorkspace } from "./symlinker.ts";
import { fetchLatestGitHubCommit, compareCommitShas } from "./updater.ts";
import { Skill, Workspace } from "../types/skills.ts";

const homeDir = Deno.env.get("HOME") || "/Users/nartnos";

export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/skills" && req.method === "GET") {
    // Scan global skill locations
    const claudeGlobal = await scanDirectoryForSkills(`${homeDir}/.claude/skills`, "global", "claude-code");
    const cursorGlobal = await scanDirectoryForSkills(`${homeDir}/.cursor/skills`, "global", "cursor");
    const geminiGlobal = await scanDirectoryForSkills(`${homeDir}/.gemini/config/skills`, "global", "gemini");
    const genericGlobal = await scanDirectoryForSkills(`${homeDir}/.skills`, "global", "general");

    const allSkills = [...claudeGlobal, ...cursorGlobal, ...geminiGlobal, ...genericGlobal];
    return Response.json({ skills: allSkills });
  }

  if (url.pathname === "/api/toggle" && req.method === "POST") {
    const { skillSlug, sourcePath, workspacePath, agent, enable } = await req.json();
    let success = false;
    if (enable) {
      success = await enableSkillInWorkspace(sourcePath, skillSlug, workspacePath, agent);
    } else {
      success = await disableSkillInWorkspace(skillSlug, workspacePath, agent);
    }
    return Response.json({ success });
  }

  return new Response("Not Found", { status: 404 });
}
```

- [ ] **Step 3: Wire `handleApiRequest` into `desktop.ts`**

```ts
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleApiRequest } from "./src/backend/api.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname.startsWith("/api/")) {
    return handleApiRequest(req);
  }
  return serveDir(req, { fsRoot: "./dist", quiet: true });
});
```

- [ ] **Step 4: Create Frontend API Client (`src/client/apiClient.ts`)**

```ts
import { Skill, Workspace } from "../types/skills.ts";

export const api = {
  async getSkills(): Promise<Skill[]> {
    const res = await fetch("/api/skills");
    if (!res.ok) throw new Error("Failed to fetch skills");
    const data = await res.json();
    return data.skills;
  },

  async toggleSkill(params: {
    skillSlug: string;
    sourcePath: string;
    workspacePath: string;
    agent: string;
    enable: boolean;
  }): Promise<boolean> {
    const res = await fetch("/api/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    return data.success;
  },
};
```

- [ ] **Step 5: Run tests to verify API handling**

Run: `deno test tests/api_test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/backend/api.ts src/client/apiClient.ts desktop.ts tests/api_test.ts
git commit -m "feat: wire up backend API routes and frontend client"
```

---

### Task 6: Frontend - 3-Column Layout & Sidebar (Column 1)

**Files:**
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/WorkspaceSelector.tsx`
- Create: `src/hooks/useWorkspaces.ts`

**Interfaces:**
- Consumes: Navigation states and workspace list.
- Produces: macOS-style left sidebar with Workspace dropdown, Skills/Agents/Prompts/Settings navigation tabs.

- [ ] **Step 1: Implement `useWorkspaces` hook for state management**

```ts
import { useState, useEffect } from "react";
import { Workspace } from "../types/skills.ts";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: "global", name: "Global Scope", path: "~/.skills", isCurrent: true },
    { id: "skillet", name: "skillet (Current)", path: "/Users/nartnos/Developer/work/skillet", isCurrent: false },
  ]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace>(workspaces[0]);

  return { workspaces, selectedWorkspace, setSelectedWorkspace };
}
```

- [ ] **Step 2: Implement `Sidebar.tsx` matching macOS/Vesper design**

```tsx
import React from "react";
import { Sparkles, Bot, Terminal, Settings, FolderGit2 } from "lucide-react";
import { Workspace } from "../types/skills.ts";

interface SidebarProps {
  currentTab: "skills" | "agents" | "prompts" | "settings";
  setCurrentTab: (tab: "skills" | "agents" | "prompts" | "settings") => void;
  skillsCount: number;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onSelectWorkspace: (ws: Workspace) => void;
}

export function Sidebar({
  currentTab,
  setCurrentTab,
  skillsCount,
  workspaces,
  selectedWorkspace,
  onSelectWorkspace,
}: SidebarProps) {
  return (
    <aside class="w-64 bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800/80 flex flex-col h-full select-none">
      {/* App Header */}
      <div class="p-4 border-b border-zinc-800/60 flex items-center gap-3">
        <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <Sparkles class="w-4 h-4 text-zinc-950 font-black" />
        </div>
        <div>
          <h1 class="text-sm font-semibold text-zinc-100 tracking-tight">Skillet</h1>
          <p class="text-xs text-zinc-500">Skills & Prompts</p>
        </div>
      </div>

      {/* Workspace Selector */}
      <div class="p-3 border-b border-zinc-800/40">
        <label class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 mb-1.5 block">
          Scope / Workspace
        </label>
        <div class="relative">
          <select
            value={selectedWorkspace.id}
            onChange={(e) => {
              const ws = workspaces.find((w) => w.id === e.target.value);
              if (ws) onSelectWorkspace(ws);
            }}
            class="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-md px-3 py-2 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
          <FolderGit2 class="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2.5 pointer-events-none" />
        </div>
      </div>

      {/* Navigation items */}
      <nav class="flex-1 p-2 space-y-1">
        <button
          onClick={() => setCurrentTab("skills")}
          class={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "skills"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div class="flex items-center gap-2.5">
            <Sparkles class="w-4 h-4 text-orange-400" />
            <span>Skills</span>
          </div>
          <span class="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">
            {skillsCount}
          </span>
        </button>

        <button
          onClick={() => setCurrentTab("agents")}
          class={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "agents"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div class="flex items-center gap-2.5">
            <Bot class="w-4 h-4 text-sky-400" />
            <span>Agents</span>
          </div>
        </button>

        <button
          onClick={() => setCurrentTab("prompts")}
          class={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "prompts"
              ? "bg-zinc-800/90 text-zinc-100 shadow-sm"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <div class="flex items-center gap-2.5">
            <Terminal class="w-4 h-4 text-emerald-400" />
            <span>Prompts</span>
          </div>
        </button>
      </nav>

      {/* Settings at bottom */}
      <div class="p-2 border-t border-zinc-800/60">
        <button
          onClick={() => setCurrentTab("settings")}
          class={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-all ${
            currentTab === "settings"
              ? "bg-zinc-800/90 text-zinc-100"
              : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
          }`}
        >
          <Settings class="w-4 h-4 text-zinc-400" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Sidebar.tsx src/hooks/useWorkspaces.ts
git commit -m "feat: implement macOS-style 3-column navigation sidebar"
```

---

### Task 7: Frontend - Center Column: Package & Skill List (Column 2)

**Files:**
- Create: `src/components/SkillList.tsx`
- Create: `src/components/SearchBar.tsx`
- Create: `src/components/PackageGroup.tsx`

**Interfaces:**
- Consumes: Filtered skills array, package grouping, search keyword.
- Produces: Center column displaying grouped packages and individual skill rows with update badges and trigger commands.

- [ ] **Step 1: Implement `PackageGroup.tsx` and `SkillList.tsx`**

```tsx
import React, { useState } from "react";
import { Search, RefreshCw, Plus, ArrowUpCircle, ChevronRight } from "lucide-react";
import { Skill, SkillPackage } from "../types/skills.ts";

interface SkillListProps {
  skills: Skill[];
  selectedSkill: Skill | null;
  onSelectSkill: (skill: Skill) => void;
  onCheckUpdates: () => void;
  onRescan: () => void;
  isLoading: boolean;
}

export function SkillList({
  skills,
  selectedSkill,
  onSelectSkill,
  onCheckUpdates,
  onRescan,
  isLoading,
}: SkillListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSkills = skills.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group by package
  const grouped = filteredSkills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const pkg = skill.packageName || "Global skills";
    if (!acc[pkg]) acc[pkg] = [];
    acc[pkg].push(skill);
    return acc;
  }, {});

  return (
    <section class="w-80 bg-zinc-900/50 border-r border-zinc-800/80 flex flex-col h-full">
      {/* Top action toolbar */}
      <div class="p-3 border-b border-zinc-800/80 space-y-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-xs font-semibold text-zinc-200">{skills.length} skills</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              onClick={onCheckUpdates}
              title="Check for updates"
              class="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] font-medium transition flex items-center gap-1"
            >
              <ArrowUpCircle class="w-3 h-3 text-orange-400" />
              <span>Updates</span>
            </button>
            <button
              onClick={onRescan}
              title="Rescan local directories"
              class="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs transition"
            >
              <RefreshCw class={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Search input */}
        <div class="relative">
          <Search class="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search skills and prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            class="w-full bg-zinc-950/70 border border-zinc-800 text-zinc-200 text-xs rounded-md pl-8 pr-3 py-1.5 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
        </div>
      </div>

      {/* Grouped Skills List */}
      <div class="flex-1 overflow-y-auto p-2 space-y-4">
        {Object.entries(grouped).map(([pkgName, pkgSkills]) => (
          <div key={pkgName} class="space-y-1">
            <div class="px-2 py-1 flex items-center justify-between text-[11px] font-semibold text-zinc-400 tracking-wide uppercase">
              <span>{pkgName}</span>
              <span class="text-zinc-600 font-mono text-[10px]">{pkgSkills.length}</span>
            </div>

            <div class="space-y-0.5">
              {pkgSkills.map((skill) => {
                const isSelected = selectedSkill?.id === skill.id;
                return (
                  <button
                    key={skill.id}
                    onClick={() => onSelectSkill(skill)}
                    class={`w-full text-left px-2.5 py-2 rounded-md transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-orange-500/10 text-orange-200 border border-orange-500/30"
                        : "text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100"
                    }`}
                  >
                    <div class="min-w-0 flex-1 pr-2">
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs font-mono font-medium truncate">
                          {skill.metadata.trigger || `/${skill.slug}`}
                        </span>
                        {skill.updateAvailable && (
                          <span class="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p class="text-[11px] text-zinc-500 truncate mt-0.5">
                        {skill.metadata.description || skill.name}
                      </p>
                    </div>
                    <ChevronRight class={`w-3.5 h-3.5 transition-transform ${isSelected ? "text-orange-400 translate-x-0.5" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SkillList.tsx
git commit -m "feat: implement center column grouped skill list with search and update badges"
```

---

### Task 8: Frontend - Right Column: Detail Pane, Markdown Viewer & Switchboard (Column 3)

**Files:**
- Create: `src/components/SkillDetail.tsx`
- Create: `src/components/MarkdownViewer.tsx`
- Create: `src/components/RepoMatrix.tsx`

**Interfaces:**
- Consumes: Selected `Skill`, active `Workspace`, toggle action handler.
- Produces: Right detail pane showing live `SKILL.md` rendered markdown, metadata table, and repo toggle switchboard.

- [ ] **Step 1: Implement `MarkdownViewer.tsx` using `marked`**

```tsx
import React from "react";
import { parse as parseMarkdown } from "npm:marked@15.0.7";

interface MarkdownViewerProps {
  content: string;
}

export function MarkdownViewer({ content }: MarkdownViewerProps) {
  const html = parseMarkdown(content);
  return (
    <div
      class="prose prose-invert prose-xs max-w-none text-zinc-300 prose-headings:text-zinc-100 prose-headings:font-semibold prose-code:text-orange-300 prose-code:bg-zinc-800/80 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800"
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  );
}
```

- [ ] **Step 2: Implement `SkillDetail.tsx` with Per-Repo Switchboard**

```tsx
import React from "react";
import { Sparkles, Globe, FolderGit2, Check, RefreshCw, Trash2, ArrowUpRight } from "lucide-react";
import { Skill, Workspace } from "../types/skills.ts";
import { MarkdownViewer } from "./MarkdownViewer.tsx";

interface SkillDetailProps {
  skill: Skill | null;
  workspaces: Workspace[];
  selectedWorkspace: Workspace;
  onToggleInRepo: (ws: Workspace, enable: boolean) => void;
}

export function SkillDetail({
  skill,
  workspaces,
  selectedWorkspace,
  onToggleInRepo,
}: SkillDetailProps) {
  if (!skill) {
    return (
      <div class="flex-1 flex flex-col items-center justify-center text-zinc-600 h-full p-6 text-center">
        <Sparkles class="w-10 h-10 mb-3 stroke-[1.5] text-zinc-700" />
        <p class="text-xs font-medium">Select a skill from the list to view instructions & toggles</p>
      </div>
    );
  }

  return (
    <main class="flex-1 bg-zinc-950 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div class="p-6 border-b border-zinc-800/80 bg-zinc-900/20 flex items-start justify-between">
        <div class="space-y-2">
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-zinc-800 border border-zinc-700/50">
              <Sparkles class="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-zinc-100">{skill.name}</h2>
                <span class="px-2 py-0.5 text-[10px] font-medium rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {skill.scope === "global" ? "Global" : "Project"}
                </span>
                <span class="px-2 py-0.5 text-[10px] font-mono rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                  {skill.metadata.trigger}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">{skill.metadata.description}</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          {skill.updateAvailable && (
            <button class="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold rounded-md text-xs transition flex items-center gap-1.5 shadow-md shadow-amber-500/20">
              <RefreshCw class="w-3.5 h-3.5" />
              Update
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div class="p-6 space-y-6 flex-1">
        {/* Metadata Grid */}
        <div class="grid grid-cols-2 gap-3 text-xs bg-zinc-900/60 p-3.5 rounded-lg border border-zinc-800/80">
          <div>
            <span class="text-zinc-500 block text-[10px] uppercase font-semibold">Source Package</span>
            <span class="text-zinc-200 font-mono text-xs">{skill.packageName}</span>
          </div>
          <div>
            <span class="text-zinc-500 block text-[10px] uppercase font-semibold">Agent Target</span>
            <span class="text-zinc-200 capitalize font-medium">{skill.agent}</span>
          </div>
          <div class="col-span-2">
            <span class="text-zinc-500 block text-[10px] uppercase font-semibold">Path on Disk</span>
            <span class="text-zinc-400 font-mono text-[11px] truncate block">{skill.path}</span>
          </div>
        </div>

        {/* Per-Repository Switchboard */}
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <FolderGit2 class="w-3.5 h-3.5 text-zinc-400" />
              Per-Repository Activation
            </h3>
          </div>

          <div class="border border-zinc-800 rounded-lg overflow-hidden divide-y divide-zinc-800/80">
            {workspaces.map((ws) => (
              <div key={ws.id} class="px-3.5 py-2.5 flex items-center justify-between bg-zinc-900/40 hover:bg-zinc-900/80 transition">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-zinc-200">{ws.name}</span>
                  <span class="text-[10px] font-mono text-zinc-500 truncate max-w-xs">{ws.path}</span>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={ws.id === "global" || skill.scope === "global"}
                    onChange={(e) => onToggleInRepo(ws, e.target.checked)}
                    class="sr-only peer"
                  />
                  <div class="w-8 h-4 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-300 after:border-zinc-300 after:border after:rounded-full after:h-3 after:width-3 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white" />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* SKILL.md Markdown Preview */}
        <div class="space-y-3 pt-2">
          <h3 class="text-xs font-bold uppercase tracking-wider text-zinc-400">
            SKILL.md Documentation & Prompts
          </h3>
          <div class="bg-zinc-900/40 border border-zinc-800/80 rounded-lg p-5">
            <MarkdownViewer content={skill.rawMarkdown || "# No documentation provided"} />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SkillDetail.tsx src/components/MarkdownViewer.tsx
git commit -m "feat: implement skill detail pane with markdown preview and repo toggles"
```

---

### Task 9: Complete Integration & Build Verification

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: All UI components (`Sidebar`, `SkillList`, `SkillDetail`) and API client.
- Produces: Complete, operational Skillet desktop interface.

- [ ] **Step 1: Assemble all components in `src/App.tsx`**

```tsx
import React, { useState, useEffect } from "react";
import { Sidebar } from "./components/Sidebar.tsx";
import { SkillList } from "./components/SkillList.tsx";
import { SkillDetail } from "./components/SkillDetail.tsx";
import { useWorkspaces } from "./hooks/useWorkspaces.ts";
import { api } from "./client/apiClient.ts";
import { Skill } from "./types/skills.ts";

export function App() {
  const [currentTab, setCurrentTab] = useState<"skills" | "agents" | "prompts" | "settings">("skills");
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { workspaces, selectedWorkspace, setSelectedWorkspace } = useWorkspaces();

  const loadSkills = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSkills();
      setSkills(data);
      if (data.length > 0 && !selectedSkill) {
        setSelectedSkill(data[0]);
      }
    } catch (err) {
      console.error("Failed to load skills:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSkills();
  }, []);

  const handleToggle = async (ws: any, enable: boolean) => {
    if (!selectedSkill) return;
    await api.toggleSkill({
      skillSlug: selectedSkill.slug,
      sourcePath: selectedSkill.path,
      workspacePath: ws.path,
      agent: selectedSkill.agent,
      enable,
    });
  };

  return (
    <div class="h-screen w-screen flex flex-row overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        skillsCount={skills.length}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onSelectWorkspace={setSelectedWorkspace}
      />
      <SkillList
        skills={skills}
        selectedSkill={selectedSkill}
        onSelectSkill={setSelectedSkill}
        onCheckUpdates={() => {}}
        onRescan={loadSkills}
        isLoading={isLoading}
      />
      <SkillDetail
        skill={selectedSkill}
        workspaces={workspaces}
        selectedWorkspace={selectedWorkspace}
        onToggleInRepo={handleToggle}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update `src/main.tsx`**

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App.tsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 3: Run test suite & build check**

Run: `deno task test`
Expected: All tests PASS.

Run: `deno task build`
Expected: Successfully generates complete production assets in `dist/`.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: complete Skillet desktop app integration"
```
