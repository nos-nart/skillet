# Effect v4 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Skillet's core domain, network, and storage services to Effect v4 (`effect@4.0.0-rc.115`) to provide compile-time error tracking, resilient exponential retries, bounded concurrency, and clean testability, while preserving 100% backward compatibility for all existing React UI components and 68 unit tests.

**Architecture:** We use the Managed Application Runtime pattern inspired by `pingdotgg/t3code`: define domain contracts via `Context.Service`, wire production dependencies in `Layer.mergeAll`, bundle them into a singleton `ManagedRuntime`, and export a top-level runner `runEffect` alongside a React hook `useRunEffect` that automatically cancels running fibers on component unmount. Existing Promise-based exports are preserved as thin wrappers around `runEffect`.

**Tech Stack:** Effect v4 (`effect@4.0.0-rc.115`), TypeScript 7.0.2, React 19.1.4, React Native macOS 0.81.6, Jest 29.7.0, Bun.

## Global Constraints

- Package version floor: `effect@4.0.0-rc.115` exact.
- Zero breaking changes to React UI components: all existing UI imports and signatures in `DiscoverTab.tsx`, `SkillList.tsx`, `SkillDetail.tsx`, and `App.tsx` must remain valid and operational.
- Test safety: all 68 existing Jest unit tests across 12 suites must pass without regression at every step.
- Type integrity: `tsc --noEmit -p tsconfig.legend.json` must pass with 0 errors.
- React Doctor health: maintain 100/100 score on React Doctor.
- Build release: `bun scripts/release.ts` must successfully package the macOS desktop app.
- Explanation rule: explain DevOps, architecture, and Effect concepts in simple terms suitable for a junior developer.

---

### Task 1: Install Effect v4 & Configure Jest Test Environment

**Files:**
- Modify: `package.json`
- Modify: `apps/skillet/package.json`
- Modify: `apps/skillet/jest.config.cjs`
- Test: `apps/skillet/src/services/__tests__/effectSanity.test.ts`

**Interfaces:**
- Consumes: `effect@4.0.0-rc.115` from npm
- Produces: Working `effect` import in both TypeScript compilation and Jest runtime

- [ ] **Step 1: Write failing sanity test**

Create `apps/skillet/src/services/__tests__/effectSanity.test.ts`:
```ts
import { Effect } from "effect";

describe("Effect v4 Sanity", () => {
  it("executes a simple synchronous effect", () => {
    const program = Effect.succeed(42);
    const result = Effect.runSync(program);
    expect(result).toBe(42);
  });

  it("executes an asynchronous promise effect", async () => {
    const program = Effect.promise(() => Promise.resolve("skillet"));
    const result = await Effect.runPromise(program);
    expect(result).toBe("skillet");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/skillet/src/services/__tests__/effectSanity.test.ts`
Expected: FAIL (Cannot find module 'effect' or unexpected token)

- [ ] **Step 3: Add `effect` dependency and configure Jest**

Update `package.json` devDependencies:
```json
"devDependencies": {
  "effect": "4.0.0-rc.115",
  ...
}
```

Update `apps/skillet/package.json` dependencies:
```json
"dependencies": {
  "effect": "4.0.0-rc.115",
  ...
}
```

Run `bun install`.
If Jest fails to resolve or transform `effect` (ESM module), configure `transformIgnorePatterns` in `apps/skillet/jest.config.cjs`:
```js
transformIgnorePatterns: [
  "node_modules/(?!(effect)/)"
],
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/skillet/src/services/__tests__/effectSanity.test.ts`
Expected: PASS (2 passed)

- [ ] **Step 5: Verify existing 68 tests still pass**

Run: `bun run test`
Expected: PASS (13 suites passed, 70 tests passed)

- [ ] **Step 6: Commit**

```bash
git add package.json apps/skillet/package.json bun.lock apps/skillet/jest.config.cjs apps/skillet/src/services/__tests__/effectSanity.test.ts
git commit -m "build: install effect v4 rc115 and verify jest test runner"
```

---

### Task 2: Typed Domain Errors & Boundary Schemas

**Files:**
- Create: `apps/skillet/src/services/errors.ts`
- Create: `apps/skillet/src/services/schemas.ts`
- Test: `apps/skillet/src/services/__tests__/schemas.test.ts`

**Interfaces:**
- Consumes: `effect/Schema`
- Produces:
  - Errors: `GitHubRateLimitError`, `RepoNotFoundError`, `GitHubNetworkError`, `InvalidSlugError`, `FsError`, `SkillParseError`
  - Schemas: `SkillFrontmatterSchema`, `SkillsLockSchema`, `GitHubRepoInfoSchema`, `DiscoveredSkillItemSchema`

- [ ] **Step 1: Write failing schema tests**

Create `apps/skillet/src/services/__tests__/schemas.test.ts`:
```ts
import { Schema } from "effect";
import {
  GitHubRateLimitError,
  RepoNotFoundError,
  GitHubNetworkError,
  InvalidSlugError,
  FsError,
  SkillParseError,
} from "../errors";
import {
  SkillFrontmatterSchema,
  SkillsLockSchema,
  GitHubRepoInfoSchema,
  DiscoveredSkillItemSchema,
} from "../schemas";

describe("Effect v4 Schemas and Errors", () => {
  it("creates typed errors with correct tags and fields", () => {
    const err = new GitHubRateLimitError({ message: "API rate limit exceeded", resetAt: 1700000000 });
    expect(err._tag).toBe("GitHubRateLimitError");
    expect(err.message).toBe("API rate limit exceeded");
    expect(err.resetAt).toBe(1700000000);
  });

  it("decodes valid skills lock JSON successfully", () => {
    const raw = {
      version: 1,
      skills: {
        "nos-nart/skillet/find-skills": {
          source: "github",
          repo: "nos-nart/skillet",
          path: "skills/find-skills",
          commit: "abcdef1",
          installedAt: 1700000000,
        },
      },
    };
    const decoded = Schema.decodeUnknownSync(SkillsLockSchema)(raw);
    expect(decoded.version).toBe(1);
    expect(decoded.skills["nos-nart/skillet/find-skills"].commit).toBe("abcdef1");
  });

  it("rejects invalid frontmatter missing required name field", () => {
    const raw = { description: "Missing name" };
    expect(() => Schema.decodeUnknownSync(SkillFrontmatterSchema)(raw)).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/skillet/src/services/__tests__/schemas.test.ts`
Expected: FAIL (Cannot find module '../errors' or '../schemas')

- [ ] **Step 3: Implement `errors.ts` and `schemas.ts`**

Create `apps/skillet/src/services/errors.ts`:
```ts
import * as Schema from "effect/Schema";

export class GitHubRateLimitError extends Schema.TaggedErrorClass<GitHubRateLimitError>()(
  "GitHubRateLimitError",
  {
    message: Schema.String,
    resetAt: Schema.optionalKey(Schema.Number),
  },
) {}

export class RepoNotFoundError extends Schema.TaggedErrorClass<RepoNotFoundError>()(
  "RepoNotFoundError",
  {
    owner: Schema.String,
    repo: Schema.String,
    message: Schema.String,
  },
) {}

export class GitHubNetworkError extends Schema.TaggedErrorClass<GitHubNetworkError>()(
  "GitHubNetworkError",
  {
    message: Schema.String,
    status: Schema.optionalKey(Schema.Number),
  },
) {}

export class InvalidSlugError extends Schema.TaggedErrorClass<InvalidSlugError>()(
  "InvalidSlugError",
  {
    slug: Schema.String,
  },
) {}

export class FsError extends Schema.TaggedErrorClass<FsError>()(
  "FsError",
  {
    operation: Schema.String,
    path: Schema.String,
    message: Schema.String,
  },
) {}

export class SkillParseError extends Schema.TaggedErrorClass<SkillParseError>()(
  "SkillParseError",
  {
    path: Schema.String,
    message: Schema.String,
  },
) {}
```

Create `apps/skillet/src/services/schemas.ts`:
```ts
import * as Schema from "effect/Schema";

export const SkillFrontmatterSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optionalKey(Schema.String),
  tags: Schema.optionalKey(Schema.Array(Schema.String)),
  version: Schema.optionalKey(Schema.String),
});
export type SkillFrontmatter = typeof SkillFrontmatterSchema.Type;

export const SkillsLockItemSchema = Schema.Struct({
  source: Schema.String,
  repo: Schema.String,
  path: Schema.String,
  commit: Schema.String,
  installedAt: Schema.Number,
});
export type SkillsLockItem = typeof SkillsLockItemSchema.Type;

export const SkillsLockSchema = Schema.Struct({
  version: Schema.Number,
  skills: Schema.Record(Schema.String, SkillsLockItemSchema),
});
export type SkillsLock = typeof SkillsLockSchema.Type;

export const GitHubTreeItemSchema = Schema.Struct({
  path: Schema.String,
  mode: Schema.String,
  type: Schema.String,
  sha: Schema.String,
  size: Schema.optionalKey(Schema.Number),
  url: Schema.String,
});
export type GitHubTreeItem = typeof GitHubTreeItemSchema.Type;

export const GitHubRepoInfoSchema = Schema.Struct({
  defaultBranch: Schema.String,
  description: Schema.NullOr(Schema.String),
  stars: Schema.Number,
  updatedAt: Schema.String,
});
export type GitHubRepoInfo = typeof GitHubRepoInfoSchema.Type;

export const DiscoveredSkillItemSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.String,
  repo: Schema.String,
  path: Schema.String,
  branch: Schema.String,
  tags: Schema.Array(Schema.String),
});
export type DiscoveredSkillItem = typeof DiscoveredSkillItemSchema.Type;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/skillet/src/services/__tests__/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/skillet/src/services/errors.ts apps/skillet/src/services/schemas.ts apps/skillet/src/services/__tests__/schemas.test.ts
git commit -m "feat(services): implement typed domain errors and boundary schemas with effect v4"
```

---

### Task 3: Managed Application Runtime & `useRunEffect` React Hook

**Files:**
- Create: `apps/skillet/src/services/runtime.ts`
- Create: `apps/skillet/src/hooks/useRunEffect.ts`
- Test: `apps/skillet/src/services/__tests__/runtime.test.ts`
- Test: `apps/skillet/src/hooks/__tests__/useRunEffect.test.ts`

**Interfaces:**
- Consumes: `ManagedRuntime` from `effect`, `Layer`
- Produces:
  - `skilletRuntime`: `ManagedRuntime<AppServices>`
  - `runEffect`: `<A, E>(effect: Effect<A, E, AppServices>) => Promise<A>`
  - `useRunEffect`: React hook returning `{ run, isLoading, error }`

- [ ] **Step 1: Write failing runtime and hook tests**

Create `apps/skillet/src/services/__tests__/runtime.test.ts`:
```ts
import { Effect, Context, Layer } from "effect";
import { ManagedRuntime } from "effect";
import { runEffect, skilletRuntime } from "../runtime";

describe("Managed Application Runtime", () => {
  it("executes effect with runtime services", async () => {
    const testEffect = Effect.succeed("runtime-active");
    const result = await runEffect(testEffect);
    expect(result).toBe("runtime-active");
  });

  it("handles effect failures via promise rejection", async () => {
    const failingEffect = Effect.fail(new Error("runtime-error"));
    await expect(runEffect(failingEffect)).rejects.toThrow("runtime-error");
  });
});
```

Create `apps/skillet/src/hooks/__tests__/useRunEffect.test.ts`:
```ts
import { Effect } from "effect";
import { renderHook, act } from "@testing-library/react";
import { useRunEffect } from "../useRunEffect";

describe("useRunEffect hook", () => {
  it("tracks loading state and returns data on success", async () => {
    const { result } = renderHook(() => useRunEffect());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    let output: string | undefined;
    await act(async () => {
      output = await result.current.run(Effect.succeed("hook-success"));
    });

    expect(output).toBe("hook-success");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `bun run test apps/skillet/src/services/__tests__/runtime.test.ts apps/skillet/src/hooks/__tests__/useRunEffect.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `runtime.ts` and `useRunEffect.ts`**

Create `apps/skillet/src/services/runtime.ts`:
```ts
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Layer from "effect/Layer";
import type * as Effect from "effect/Effect";

// Base application layer (augmented as services are migrated)
export const AppLiveLayer = Layer.empty;
export type AppServices = Layer.Success<typeof AppLiveLayer>;

export const skilletRuntime = ManagedRuntime.make(AppLiveLayer);

export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, AppServices>,
): Promise<A> => skilletRuntime.runPromise(effect);
```

Create `apps/skillet/src/hooks/useRunEffect.ts`:
```ts
import { useCallback, useEffect, useRef, useState } from "react";
import type * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { skilletRuntime, type AppServices } from "../services/runtime";

export interface RunEffectOptions<A, E> {
  onSuccess?: (value: A) => void;
  onError?: (error: E) => void;
}

export function useRunEffect() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const activeFiberRef = useRef<Fiber.Fiber<any, any> | null>(null);

  useEffect(() => {
    return () => {
      if (activeFiberRef.current) {
        activeFiberRef.current.interruptUnsafe();
        activeFiberRef.current = null;
      }
    };
  }, []);

  const run = useCallback(
    async <A, E>(
      effect: Effect.Effect<A, E, AppServices>,
      options?: RunEffectOptions<A, E>,
    ): Promise<A> => {
      setIsLoading(true);
      setError(null);
      try {
        const fiber = skilletRuntime.runFork(effect);
        activeFiberRef.current = fiber;
        const result = await skilletRuntime.runPromise(Fiber.join(fiber));
        options?.onSuccess?.(result);
        return result;
      } catch (cause) {
        setError(cause);
        options?.onError?.(cause as E);
        throw cause;
      } finally {
        setIsLoading(false);
        activeFiberRef.current = null;
      }
    },
    [],
  );

  return { run, isLoading, error };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `bun run test apps/skillet/src/services/__tests__/runtime.test.ts apps/skillet/src/hooks/__tests__/useRunEffect.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/skillet/src/services/runtime.ts apps/skillet/src/hooks/useRunEffect.ts apps/skillet/src/services/__tests__/runtime.test.ts apps/skillet/src/hooks/__tests__/useRunEffect.test.ts
git commit -m "feat(runtime): add managed application runtime and useRunEffect hook"
```

---

### Task 4: Effect-ify GitHub Service with Auto-Retries

**Files:**
- Modify: `apps/skillet/src/services/github.ts`
- Modify: `apps/skillet/src/services/runtime.ts`
- Modify: `apps/skillet/src/services/__tests__/github.test.ts`

**Interfaces:**
- Consumes: `GitHubRateLimitError`, `RepoNotFoundError`, `GitHubNetworkError`, `GitHubRepoInfoSchema`, `GitHubTreeItemSchema`
- Produces:
  - `GitHubClient`: `Context.Service<GitHubClient, ...>`
  - `LiveGitHubClient`: `Layer.Layer<GitHubClient>`
  - `fetchRepoTreeEffect`: `(repo: string, branch: string) => Effect<...>`
  - `fetchRawFileEffect`: `(repo: string, branch: string, path: string) => Effect<...>`
  - `getRepoInfoEffect`: `(repo: string) => Effect<...>`
  - Preserves Promise functions: `fetchRepoTree`, `fetchRawFile`, `getRepoInfo`

- [ ] **Step 1: Add new tests for Effect workflows and retries**

Update `apps/skillet/src/services/__tests__/github.test.ts`:
- Add test for `fetchRepoTreeEffect` mapping 404 to `RepoNotFoundError`.
- Add test for `fetchRepoTreeEffect` mapping 403 / rate limit to `GitHubRateLimitError`.
- Add test verifying transient network error auto-retries using `Schedule.exponential`.
- Verify existing tests for `fetchRepoTree` and `fetchRawFile` continue passing unchanged.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/skillet/src/services/__tests__/github.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement Effect GitHub service with retries**

Refactor `apps/skillet/src/services/github.ts`:
- Define `GitHubClient` using `Context.Service`.
- Implement `LiveGitHubClient` using `Layer.effect`.
- Add retry schedule:
  ```ts
  const retrySchedule = {
    schedule: Schedule.exponential("250 millis"),
    times: 3,
    while: (err: unknown) => err instanceof GitHubNetworkError,
  };
  ```
- Implement `fetchRepoTreeEffect`, `fetchRawFileEffect`, `getRepoInfoEffect` using `Effect.tryPromise` with status checks and error mapping.
- Wire `LiveGitHubClient` into `AppLiveLayer` in `apps/skillet/src/services/runtime.ts`.
- Keep existing exported Promise functions calling `runEffect(...)`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/skillet/src/services/__tests__/github.test.ts`
Expected: PASS

- [ ] **Step 5: Verify all existing tests still pass**

Run: `bun run test`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/skillet/src/services/github.ts apps/skillet/src/services/runtime.ts apps/skillet/src/services/__tests__/github.test.ts
git commit -m "refactor(github): implement Effect GitHubClient with typed errors and auto-retries"
```

---

### Task 5: Effect-ify Updater Service with Bounded Concurrency

**Files:**
- Modify: `apps/skillet/src/services/updater.ts`
- Modify: `apps/skillet/src/services/__tests__/updater.test.ts` (or add new test file)

**Interfaces:**
- Consumes: `GitHubClient`, `fetchRepoTreeEffect`, `fetchRawFileEffect`
- Produces:
  - `checkSkillUpdatesEffect`: `(skills: InstalledSkill[]) => Effect<Record<string, SkillUpdateInfo>, ...>`
  - Preserves Promise function: `checkSkillUpdates`

- [ ] **Step 1: Write test for bounded concurrency in updater**

Create or update `apps/skillet/src/services/__tests__/updater.test.ts`:
- Test that checking updates for 10 skills runs with bounded concurrency (concurrency limit = 5).
- Test that if one skill check fails, other skills still complete successfully.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/skillet/src/services/__tests__/updater.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `checkSkillUpdatesEffect`**

Refactor `apps/skillet/src/services/updater.ts`:
- Implement `checkSkillUpdatesEffect` using:
  ```ts
  Effect.all(
    skills.map((skill) => checkSingleSkillUpdateEffect(skill)),
    { concurrency: 5, mode: "default" }
  )
  ```
- Keep existing `checkSkillUpdates` delegating to `runEffect(checkSkillUpdatesEffect(skills))`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/skillet/src/services/__tests__/updater.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/skillet/src/services/updater.ts apps/skillet/src/services/__tests__/updater.test.ts
git commit -m "refactor(updater): implement checkSkillUpdatesEffect with bounded concurrency"
```

---

### Task 6: Effect-ify Native Skills FileSystem Service

**Files:**
- Modify: `apps/skillet/src/services/skills.ts`
- Modify: `apps/skillet/src/services/runtime.ts`
- Modify: `apps/skillet/src/services/__tests__/skills.test.ts`

**Interfaces:**
- Consumes: `@skillet/skills-fs`, `FsError`, `InvalidSlugError`
- Produces:
  - `SkillsFileSystem`: `Context.Service<SkillsFileSystem, ...>`
  - `LiveSkillsFileSystem`: `Layer.Layer<SkillsFileSystem>`
  - `listSkillsEffect`, `readSkillMdEffect`, `toggleSkillEffect`, `copySkillToWorkspaceEffect`
  - Preserves Promise functions: `listSkills`, `readSkillMd`, `toggleSkill`, `copySkillToWorkspace`

- [ ] **Step 1: Write tests for `SkillsFileSystem` service & layer**

Update `apps/skillet/src/services/__tests__/skills.test.ts`:
- Add test for `listSkillsEffect` with an in-memory `TestSkillsFileSystem` layer.
- Verify path traversal attempts yield `InvalidSlugError`.
- Verify all existing 15+ tests for `listSkills`, `toggleSkill`, `readSkillMd` pass.

- [ ] **Step 2: Run test to verify it fails**

Run: `bun run test apps/skillet/src/services/__tests__/skills.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `SkillsFileSystem` service and layers**

Refactor `apps/skillet/src/services/skills.ts`:
- Define `SkillsFileSystem` service with `Context.Service`.
- Implement `LiveSkillsFileSystem` layer backed by `@skillet/skills-fs`.
- Export `listSkillsEffect`, `readSkillMdEffect`, `toggleSkillEffect`, `copySkillToWorkspaceEffect`.
- Wire `LiveSkillsFileSystem` into `AppLiveLayer` in `apps/skillet/src/services/runtime.ts`.
- Retain Promise exports delegating to `runEffect`.

- [ ] **Step 4: Run test to verify it passes**

Run: `bun run test apps/skillet/src/services/__tests__/skills.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/skillet/src/services/skills.ts apps/skillet/src/services/runtime.ts apps/skillet/src/services/__tests__/skills.test.ts
git commit -m "refactor(skills): define SkillsFileSystem Context.Service with Live and Test layers"
```

---

### Task 7: Full Verification & Release Packaging

**Files:**
- Verify: `apps/skillet/src/**/*`
- Verify: Test suite and build artifacts

**Interfaces:**
- Consumes: All migrated services and components
- Produces: 100% green test suite, clean typecheck, React Doctor 100/100, valid macOS app bundle

- [ ] **Step 1: Run complete test suite**

Run: `bun run test`
Expected: All test suites pass (100% green).

- [ ] **Step 2: Run TypeScript typecheck**

Run: `bun run typecheck`
Expected: 0 errors.

- [ ] **Step 3: Run React Doctor diagnostics**

Verify React component health and ensure score remains 100/100.

- [ ] **Step 4: Run release packaging script**

Run: `bun scripts/release.ts`
Expected: macOS app bundle builds and packages successfully.

- [ ] **Step 5: Final commit**

```bash
git commit --allow-empty -m "chore: complete effect v4 migration verification"
```
