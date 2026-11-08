# Skillet Agent Rules

Use `.claude/skills/spark/SKILL.md` before changing Spark configuration, native SDK imports, or build scripts.

## Enforced repository rules (`/correct`)

| Rule | Why | Enforced by |
| --- | --- | --- |
| Keep `DARK_PALETTE` and `LIGHT_PALETTE` in `src/services/theme.ts` identical to `global.css` | Divergent tokens break dialog sheets and icons against Uniwind surfaces | `src/__tests__/theme.test.ts` |
| Pass `DownloadSkillInput` (`{ source, skillName, targetDir }`) to install callbacks instead of positional parameters | Positional optional arguments allow callers to silently drop `targetDir` | TypeScript (`DownloadSkillInput` in `src/services/skills.ts` and `src/dialogs.tsx`) |
| Never use `Modal`, `Dimensions.get`, or `<Animated.View className=...` in `src/**/*.tsx` | `Modal` causes SIGSEGV on macOS Fabric, `Dimensions.get` throws on macOS, and unwrapped `Animated.View` ignores `className` | `src/__tests__/macosGuardrails.test.ts` |
| Never import `@legend-apps/*` or `@skillet/skills-fs` | Replaced by `@legendapp/spark/*` and `src/services/skillsFs.ts` | `src/__tests__/macosGuardrails.test.ts` |
| Keep `engines.node` at `>=26.12.1` in `package.json` and use `node-version-file: package.json` in `.github/workflows/release.yml` without legacy `scripts/` or `apps/skillet` paths | Prevents unpatched pre-26.12.1 Node.js runtimes and stops CI workflows from drifting from root Spark scripts | `src/__tests__/macosGuardrails.test.ts` |

<!-- spark:skill:start -->
From the app root, read [Spark's app development skill](node_modules/@legendapp/spark/skills/spark/SKILL.md) before working on this app.
The installed Spark version owns these instructions; do not copy them here.
<!-- spark:skill:end -->
