# Skillet macOS (react-native-macos) Migration — Design

Date: 2026-09-09
Status: approved in chat (arch, components, data flow, errors, testing/distro)
Scope: macOS-only MVP, full parity, full native rewrite (no Deno at runtime), signed + Sparkle
Reference: `.repos/legend-apps` (`microsoft/react-native-macos@0.81.7`, Expo ~54 shell, Bun workspace)
Approach: A — Legend shell clone (chosen over B WebView hybrid, C greenfield RN-macos)

## 1. Architecture

Bun workspace modeled 1:1 on legend-apps. No fork — copy and rename.

- `apps/skillet/src/` — ported JS entry (`App.tsx`, tabs, components). Owns `app.manifest.ts`: `id: skillet`, `platforms: ["macos"]`, `bundleIds.macos`, `nativeModules.macos: [file-dialog, file-scanner, storage, skills-fs(new), window-manager, windows, native-menu, appkit-split-view, theme, sf-symbol, glass-effect-view, react-native-enriched-markdown]`, `expoModules.macos: false`.
- `shell/` — copy Legend host: `package.json` (react-native-macos 0.81.7, nitro-modules, tailwind, uniwind), `metro.config.js` (`LEGEND_APP=skillet`, `watchFolders=[root,apps,packages]`, alias `@legend-apps/app -> apps/skillet/src`, `platforms+=macos`, `withUniwindConfig`), `app.config.ts`, `react-native.config.js` (active/excluded native packages, expo unlink), `babel.config.js` (preset-expo + react-compiler), `index.native.ts` (`AppRegistry`), `src/ShellApp.tsx`, `src/global.css`, `macos/Podfile` (`platform :osx 14.0`, `fabric_enabled=1`), `.xcode.env`, `PrivacyInfo.xcprivacy`, `ensure-xcode-env.js`.
- `packages/skills-fs/` — the only new native code. TurboModule, ObjC++ in `ios/` with `s.platforms={ios,osx}` (RNFileDialog pattern): `scanSkillsDir, readSkillMd, lstat/realpath, ensureDir, symlink/unlink, isEnabled`.
- `scripts/` — copy `run/start/build/verify/package-macos-app/open/prebuild-app.ts` + `lib/{apps,nativeModules,macosShell,macosWorkspaces,macosInfoPlist,run,release,launchArgs}`. Gives `bun run skillet run/start/pods/verify macos` + `package` for free.
- Drop at MVP: `deno.json` tasks, `desktop.ts` (`Deno.serve` + `serveDir(dist)`), `dist/`, `vite.config.ts`, `@stylexjs/*` for the native target. Keep web target untouched until cutover.
- YAGNI: no iOS/Android manifests, no multi-window (`WindowProvider id="main"` single), no audio/libgit2/diff/music packages.

## 2. Components (Uniwind, not StyleX)

Decision: Uniwind. `react-native-stylex` (retyui, 120 stars) is a different API (`makeUseStyles/useStyles`) — no call-site savings. Official StyleX is web-only (Vite/Next/Webpack, `@stylex;` CSS entry, `useCSSLayers`); output is CSS classNames, while RN needs `style={}` objects. Token layer (`defineVars → var(--sk-*)`, OKLCH, layers, `:hover`/`@media`/`position:fixed`/`backdrop-filter`/`color-mix`) has no RN equivalent. Porting without a lib means rebuilding the bridge and diverging from proven `withUniwindConfig`.

- Tokens first: flatten `src/tokens.stylex.ts` + `src/index.css` into `shell/src/global.css` + `theme` tokens (`bg-background/text-foreground/border`). Fonts (Space Grotesk/JetBrains Mono) via native registration.
- `App.tsx` reducer ports as-is; render: delete `useMediaQuery` + `ResizablePanelGroup` → `<SidebarSplitView sidebarWidth={260}>` + titlebar chrome. Tokens from `localStorage` → `storage` settings screen.
- `Sidebar`: workspace `<select>` → `native-menu` + `file-dialog.open({directory:true})`; Phosphor web SVG → `SFSymbol` (AgentLogos inline SVGs portable).
- `SkillList`: `useDeferredValue` search stays; list → `LegendList` (`estimatedItemSize`, `recycleItems`, `useRecyclingState` rows, cf. chat-history App.tsx). Group-by-`packageName` stays JS.
- `SkillDetail`: meta grid → Uniwind `className`; per-workspace `Switch` keeps optimistic toggles; `ConfirmDialog` → native modal; `MarkdownViewer` (comark+shiki, 16 HTML overrides) → `<EnrichedMarkdownText flavor="github" selectable onLinkPress>` (TranscriptRow pattern; expect Shiki theme visual diff).
- `DiscoverTab` (769 LOC, top risk): split into pure `github.ts` service + presentational list + `Image` avatars; `alert()` → `Alert`.
- Dialogs (`NewSkillDialog` form/textarea, `AddBookmarkDialog` URL regex): `TextInput` + `window-manager openWindow`; regex stays.
- `ui/*`: delete `dialogStyles fixed/z50`, `resizable`, `scroll-area` divs; rebuild button/card/input/badge/separator/switch as Uniwind + `StyleSheet` only for fixed heights/overlays (Legend rule).

## 3. Data flow (Deno `/api/*` → JS services + TurboModule)

`apiClient.ts` relative-fetch signatures stay, transport goes direct (no HTTP):

- `getSkills`: `skills-fs.scanSkillsDir([~/.skills, ~/.cursor/skills, ~/.claude/skills, ...])` → `readSkillMd` → ported `parseSkillMd` (swap `npm:yaml` → JS yaml) → same dedup (realPath prefer-non-symlink, then by slug). Delete `FALLBACK_SKILLS` hardcoded paths.
- `toggle`: `skills-fs.symlink/unlink(source, workspace/agentRel/slug)`; `isEnabled` → `lstat`. Guard `validateSafeSlug`/`resolveSafeTarget` ports verbatim in JS + re-validates native.
- `workspaces/bookmarks/lockfile`: `storage.createStorage({root:"applicationSupport", subfolder:"skillet"})`. `WorkspaceManager` ports; `SKILLET_CONFIG_PATH` → storage path.
- `install/check-updates`: stays JS `fetch` (GitHub REST + raw `main→master` fallback + gist); writes via `skills-fs.writeTextFile`/`ensureDir`.
- `pick-folder`: delete `Deno.Command osascript` → `file-dialog.open({directory:true})` (`NSOpenPanel`).
- Refresh: `file-system-watcher` on skills dirs → invalidate list (replaces 300ms re-fetch hack).
- Perf: parse/scan off interaction (`runAfterInteractions` pattern); list data source stays sync.

## 4. Error handling + permissions

- Result types `{ok, data?, error?}` (`invalid_path/write_failed/slug_unsafe`, `cancelled:true` for panel cancel) across bridge; JS maps to inline UI, never redbox.
- `EACCES`/TCC → "grant Full Disk Access" empty-state. Keep `verify-app` assertions (no `NSAllowsArbitraryLoads`, no sandbox entitlements).
- Network: keep rate-limit/branch-fallback; token moves to settings; offline = cached `storage` list + "last synced".
- Native atomic-write fail → toast + retry; watcher drop → re-scan on focus.

## 5. Testing + distribution

- Gates: `typecheck` → `skillet verify macos` (Info.plist, bundle-id, linked/excluded via `react-native config`) → focused Jest (frontmatter, URL parser, slug guard — pure, verbatim) → `verify:react-compiler`. No release builds while iterating.
- `api_test` live install → mocked service test; `components_test` comark → enriched-markdown snapshot; fix stale `symlinker_test` (`.cursor/skills` vs universal `.skills`).
- Runtime: `skillet start` (Metro) + `skillet run macos`; `open` for screenshots; `test-kitchen-sink` hosts `skills-fs` integration first.
- Distribution: copy `package-macos-app.ts` (`build → ditto → codesign --deep --options runtime → notarytool submit + staple → zip → generate_appcast`). Needs `release.macos.sparkle.publicEdKey` + `signing.macos.developmentTeam` + `.env` creds. Unsigned local: `package skillet arm --skip-sign --skip-notarize --skip-appcast`. Keep `auto-updater` only because Sparkle is in scope.

## Confidence (82%)

Mapping is 1:1 (see §1–§5 file:line cites in chat). Only new ObjC++ is the symlink bridge (~100 lines). Top residual risks: token-flatten aesthetics, enriched-markdown vs shiki parity, signing env. Suggested throwaway spike (1–2d): tokens + `SkillList` in kitchen-sink + `symlink` module prototype.
