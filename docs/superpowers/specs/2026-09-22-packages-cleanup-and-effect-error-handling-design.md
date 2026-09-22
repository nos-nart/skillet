# Package Consolidation and Effect v4 Error Handling Design

## 1. Overview & Goals

This specification outlines two key architectural improvements for Skillet:
1. **Monorepo Simplification**: Prune obsolete packages from `packages/` and move the pure TypeScript `windows` module directly into `apps/skillet/src/windows`, leaving only essential native macOS Objective-C/C++ bridge modules.
2. **Comprehensive Error Handling via Effect v4**: Eliminate silent error swallowing (`try { ... } catch {}` and `.catch(() => {})`) across services and UI components, replacing them with typed Effect channels (`Effect<Success, Error>`) and actionable error reporting in the React Native UI.

---

## 2. Background & Problem Statement

### 2.1 Monorepo Overhead
Skillet inherited a multi-package monorepo structure from the Legend App upstream. While some packages contain native macOS `.podspec` files and Objective-C/C++ source code required by Xcode, others were dead code or pure TypeScript:
- `packages/appkit-split-view`: Unused by Skillet.
- `packages/windows`: Pure React/TypeScript (no native code, no `.podspec`), adding unnecessary monorepo workspace indirection.

### 2.2 Silent Error Swallowing
Across `services/skills.ts`, `services/github.ts`, `services/workspaces.ts`, and UI components (`SkillDetail.tsx`, `DiscoverTab.tsx`):
- Errors are swallowed with empty catch blocks or mapped to `null` / `false` / `[]`.
- Network failures, GitHub rate limiting (HTTP 403/429), missing repositories (HTTP 404), and filesystem permission errors fail silently without explanation to the user.
- Although `effect@4.0.0-rc.115` is installed and error schemas (`GitHubRateLimitError`, `RepoNotFoundError`, `GitHubNetworkError`, `FsError`, `InvalidSlugError`) exist, services and components do not fully use them.

---

## 3. Architecture & Detailed Design

### Stage 1: Package Cleanup (`packages/`)

#### 1. Delete `packages/appkit-split-view`
- Delete `packages/appkit-split-view/`.
- Remove `"@legend-apps/appkit-split-view": "0.0.0"` from `shell/package.json`.
- Remove entry from `scripts/lib/nativeModules.ts`.
- Run `bun install` to update `bun.lock`.

#### 2. Move `packages/windows` into `apps/skillet/src/windows`
- Move all files from `packages/windows/src/` into `apps/skillet/src/windows/`.
- Update `apps/skillet/src/App.tsx` imports from `@legend-apps/windows` to `./windows`.
- Remove `@legend-apps/windows` from `apps/skillet/package.json`.
- Delete `packages/windows/`.
- Run `bun install`.

#### 3. Preserved Native Packages
Only true native modules remain in `packages/`:
- `packages/skills-fs` (`RNSkillsFs.podspec`)
- `packages/file-dialog` (`RNFileDialog.podspec`)
- `packages/sf-symbol` (`RNSFSymbol.podspec`)
- `packages/storage` (`RNStorage.podspec`)
- `packages/syntax-parser` (`RNSyntaxParser.podspec`)
- `packages/native-text-source` (C++ dependency)
- `packages/window-manager` (`RNWindowManager.podspec`)
- `packages/legend-list-sparse-layout` (locally patched catalog dependency)

---

### Stage 2: Effect v4 Error Handling Migration

#### 1. Service Layer Design

##### `services/github.ts`
- **`browseRepoForSkillsEffect`**:
  Returns `Effect<BrowseRepoResult, GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError>`.
  - HTTP 403 / 429 → `GitHubRateLimitError`.
  - HTTP 404 → `RepoNotFoundError`.
  - Network failure / JSON decode error → `GitHubNetworkError`.
- **`fetchLatestCommitEffect`**:
  Returns `Effect<string, GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError>`.
- **Lockfile Storage (`loadSkillsLockEffect`, `saveSkillsLockEffect`)**:
  Wrap storage reading/writing with typed `FsError` on parse or persistence failure.

##### `services/skills.ts`
- **`installSkillEffect`**:
  Returns `Effect<{ path: string }, FsError | RepoNotFoundError | GitHubNetworkError | GitHubRateLimitError | InvalidSlugError>`.
  - Fails with `InvalidSlugError` if the slug is invalid or unsafe.
  - Fails with `FsError` if directory creation or file writing fails.
  - Propagates remote fetch errors (`GitHubRateLimitError`, `RepoNotFoundError`, etc.).
- **`uninstallSkillEffect`**:
  Returns `Effect<boolean, FsError | InvalidSlugError>`.
  - Fails with `InvalidSlugError` on invalid slug.
  - Propagates `FsError` if unlinking fails.
- **`listSkillsEffect` & `isSkillEnabledEffect`**:
  - `listSkillsEffect` returns `Effect<Skill[], FsError>`.
  - Propagates file access errors rather than silently returning an empty list.

##### `services/workspaces.ts`
- Return typed `Effect` for storage operations, eliminating silent swallowing of invalid JSON or storage exceptions.

#### 2. UI Layer Integration

##### `DiscoverTab.tsx`
- Replace raw promise / imperative `try ... catch` with `useRunEffect`.
- When browsing a repository fails:
  - If error is `GitHubRateLimitError`: Render alert or banner stating rate limit has been exceeded, suggesting adding a GitHub token or waiting.
  - If error is `RepoNotFoundError`: Render clear message that the repository could not be found.
  - If error is `GitHubNetworkError`: Render network connection error.
- When installing a discovered skill:
  - Show precise error reason on failure instead of generic "Could not install skill".

##### `SkillDetail.tsx`
- Refactor `runAction` using `useRunEffect` for:
  - Toggling a skill in a workspace (`toggleSkillEffect`). Revert optimistic state and show the error reason if failed.
  - Updating a skill (`downloadSkill` / `installSkillEffect`). Show error banner on failure.
  - Uninstalling a skill (`uninstallSkillEffect`). Show error banner on failure.

---

## 4. Verification Plan

1. **Automated Unit Tests**:
   - Add unit tests for `browseRepoForSkillsEffect` verifying rate-limit, 404, and network failure mappings.
   - Add unit tests for `installSkillEffect` and `uninstallSkillEffect` verifying typed error handling.
   - Run full test suite: `bun run test` (all 17+ suites, 90+ tests pass).
2. **Type Checking**:
   - `bun run typecheck` (`tsc --noEmit -p tsconfig.legend.json`) with 0 errors.
3. **App Verification**:
   - Run `bun scripts/verify-app.ts skillet macos`.
