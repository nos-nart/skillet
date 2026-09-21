# Design Spec: Skillet Effect v4 Migration

- **Date**: 2026-09-21
- **Status**: Approved
- **Scope**: Full Stack Services & React Integration (`apps/skillet`)
- **Reference Repositories**:
  - `Effect-TS/effect-smol` (Effect v4 core, patterns, and migration guide)
  - `pingdotgg/t3code` (`apps/web/src/lib/runtime.ts` and `packages/client-runtime` architecture)

---

## 1. Objectives & Guiding Principles

Migrate Skillet's core domain, network, and storage services to **Effect v4** (`effect@4.0.0-rc.115`) to achieve compile-time error tracking, resilient network retries, bounded concurrency, and clean testability.

1. **Zero Breaking Changes to UI**: All existing React components (`DiscoverTab.tsx`, `SkillList.tsx`, `SkillDetail.tsx`, `App.tsx`) and Jest unit tests (68 tests across 12 suites) will continue to work without regression.
2. **Managed Application Runtime (`ManagedRuntime`)**: Follow the `pingdotgg/t3code` pattern: define production service layers, bundle them into a singleton `ManagedRuntime`, and export a top-level runner `runEffect`.
3. **Ergonomic React Hook (`useRunEffect`)**: Provide a React hook for executing Effect workflows inside UI event handlers with automatic fiber cancellation upon component unmount.
4. **Typed Domain Errors (`Schema.TaggedErrorClass`)**: Replace untyped JavaScript `throw new Error(...)` with strongly-typed error schemas (`GitHubRateLimitError`, `RepoNotFoundError`, `InvalidSlugError`, `SkillParseError`).
5. **Data Validation at the Boundary (`Schema.Struct`)**: Validate external payloads (GitHub REST API tree responses, `SKILL.md` YAML frontmatter, and `skills-lock.json`) with `@effect/schema`.
6. **Dependency Injection via `Context.Service`**: Separate service contracts from implementations so tests can run against pure in-memory test layers without native TurboModules.

---

## 2. Architecture & Runtime Design

### A. Managed Runtime (`apps/skillet/src/services/runtime.ts`)
Creates the shared singleton runtime that lives for the application lifecycle:

```ts
import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Layer from "effect/Layer";
import type * as Effect from "effect/Effect";
import { LiveGitHubClient } from "./github";
import { LiveSkillsFileSystem } from "./skills";

// Merged production layers for Skillet desktop
export const AppLiveLayer = Layer.mergeAll(
  LiveGitHubClient,
  LiveSkillsFileSystem,
);

export type AppServices = Layer.Success<typeof AppLiveLayer>;

// Managed runtime singleton
export const skilletRuntime = ManagedRuntime.make(AppLiveLayer);

// Top-level runner for non-React callers, scripts, and backward compatibility
export const runEffect = <A, E>(effect: Effect.Effect<A, E, AppServices>): Promise<A> =>
  skilletRuntime.runPromise(effect);
```

### B. React Hook (`apps/skillet/src/hooks/useRunEffect.ts`)
Allows React components to run Effect workflows with lifecycle awareness:

```tsx
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
  const activeFiberRef = useRef<Fiber.RuntimeFiber<any, any> | null>(null);

  useEffect(() => {
    return () => {
      if (activeFiberRef.current) {
        skilletRuntime.runFork(Fiber.interrupt(activeFiberRef.current));
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
        const result = await Fiber.join(fiber);
        options?.onSuccess?.(result);
        return result;
      } catch (cause) {
        setError(cause);
        options?.onError?.(cause as E);
        throw cause;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { run, isLoading, error };
}
```

---

## 3. Services & Schemas Specification

### A. Typed Errors (`apps/skillet/src/services/errors.ts`)
```ts
import * as Schema from "effect/Schema";

export class GitHubRateLimitError extends Schema.TaggedErrorClass<GitHubRateLimitError>()(
  "GitHubRateLimitError",
  {
    message: Schema.String,
    resetAt: Schema.optional(Schema.Number),
  },
) {}

export class RepoNotFoundError extends Schema.TaggedErrorClass<RepoNotFoundError>()(
  "RepoNotFoundError",
  {
    owner: Schema.String,
    repo: Schema.String,
  },
) {}

export class GitHubNetworkError extends Schema.TaggedErrorClass<GitHubNetworkError>()(
  "GitHubNetworkError",
  {
    message: Schema.String,
    status: Schema.optional(Schema.Number),
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
```

### B. Schemas (`apps/skillet/src/services/schemas.ts`)
```ts
import * as Schema from "effect/Schema";

export const GitHubRepoInfoSchema = Schema.Struct({
  owner: Schema.String,
  repo: Schema.String,
  path: Schema.optional(Schema.String),
  branch: Schema.optional(Schema.String),
});

export const SkillsLockEntrySchema = Schema.Struct({
  source: Schema.String,
  commitSha: Schema.String,
  updatedAt: Schema.String,
  skills: Schema.Array(Schema.String),
});

export const SkillsLockSchema = Schema.Record({
  key: Schema.String,
  value: SkillsLockEntrySchema,
});
export type SkillsLock = typeof SkillsLockSchema.Type;

export const DiscoveredSkillItemSchema = Schema.Struct({
  name: Schema.String,
  path: Schema.String,
  htmlUrl: Schema.String,
});
export type DiscoveredSkillItem = typeof DiscoveredSkillItemSchema.Type;
```

### C. GitHub Client Service (`apps/skillet/src/services/github.ts`)
Following `t3code`'s `Context.Service` syntax:

```ts
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schedule from "effect/Schedule";
import { GitHubRateLimitError, RepoNotFoundError, GitHubNetworkError } from "./errors";
import { type DiscoveredSkillItem, type GitHubRepoInfo, SkillsLockSchema } from "./schemas";

export class GitHubClient extends Context.Service<
  GitHubClient,
  {
    readonly fetchLatestCommit: (
      owner: string,
      repo: string,
      token?: string,
    ) => Effect.Effect<string | null, GitHubRateLimitError | GitHubNetworkError>;

    readonly fetchRawSkillMd: (
      owner: string,
      repo: string,
      branch?: string,
      path?: string,
      token?: string,
    ) => Effect.Effect<string, RepoNotFoundError | GitHubNetworkError>;

    readonly browseRepoTree: (
      info: GitHubRepoInfo,
      token?: string,
    ) => Effect.Effect<DiscoveredSkillItem[], GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError>;
  }
>()("@skillet/services/GitHubClient") {}

export const retryTransientPolicy = Schedule.exponential("250 millis").pipe(
  Schedule.intersect(Schedule.recurs(3)),
);
```

### D. Filesystem Service (`apps/skillet/src/services/skills.ts`)
```ts
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { FsError } from "./errors";

export class SkillsFileSystem extends Context.Service<
  SkillsFileSystem,
  {
    readonly scanSkillsDir: (dir: string) => Effect.Effect<string[], FsError>;
    readonly readSkillMd: (path: string) => Effect.Effect<string, FsError>;
    readonly symlink: (source: string, target: string) => Effect.Effect<boolean, FsError>;
    readonly unlink: (target: string) => Effect.Effect<boolean, FsError>;
    readonly ensureDir: (path: string) => Effect.Effect<boolean, FsError>;
    readonly writeTextFile: (path: string, contents: string) => Effect.Effect<boolean, FsError>;
  }
>()("@skillet/services/SkillsFileSystem") {}
```

### E. Updater Service with Concurrency (`apps/skillet/src/services/updater.ts`)
```ts
export const checkSkillUpdatesEffect = (
  skills: Skill[],
  opts: { token?: string } = {},
): Effect.Effect<Record<string, boolean>, never, GitHubClient> =>
  Effect.gen(function* () {
    const client = yield* GitHubClient;
    const lock = yield* loadSkillsLockEffect();
    const updates: Record<string, boolean> = {};

    const packages = [...new Set(skills.map((s) => s.packageName).filter(Boolean))];

    // Check up to 5 repositories concurrently with individual failure recovery
    yield* Effect.all(
      packages.map((pkg) =>
        Effect.gen(function* () {
          const parsed = parseGitHubRepo(pkg);
          if (!parsed) return;
          const remoteSha = yield* client.fetchLatestCommit(parsed.owner, parsed.repo, opts.token).pipe(
            Effect.catchAll(() => Effect.succeed(null)),
          );
          if (!remoteSha) return;
          const localSha = lock[pkg]?.commitSha;
          updates[pkg] = !localSha || localSha.trim().toLowerCase() !== remoteSha.trim().toLowerCase();
        }),
      ),
      { concurrency: 5 },
    );

    return updates;
  });
```

---

## 4. Test Safety Matrix & TDD Strategy

### A. Existing Test Suites (100% Passing Gate)
1. `github.test.ts` (10 tests)
2. `discover.test.ts` (6 tests)
3. `skills.test.ts` (15 tests)
4. `install.test.ts` (6 tests)
5. `workspaces.test.ts` (5 tests)
6. `codeFence.test.ts` (13 tests)
7. UI & Theme suites (`toggle.test.ts`, `skillList.test.ts`, `theme.test.ts`, `agentLogos.test.ts`, etc. - 13 tests)

### B. New Effect Test Suite (`apps/skillet/src/services/__tests__/effectServices.test.ts`)
- **Schema Decoding**: Validates `SkillsLockSchema` successfully decodes valid files and returns typed `ParseResult.ParseError` on invalid payloads.
- **Typed Error Mapping**: Verifies 403 API response yields `GitHubRateLimitError` and 404 yields `RepoNotFoundError`.
- **Automatic Retry Verification**: Simulates 500 network error followed by 200 OK to assert `retryTransientPolicy` re-executes.
- **Concurrent Execution with Partial Failures**: Verifies `checkSkillUpdatesEffect` processes 10 items concurrently and succeeds even if 1 package fails.
- **In-Memory FileSystem Layer**: Proves that `SkillsFileSystem` can run directory scanning and symlinking tests without calling macOS TurboModules.
- **`useRunEffect` Fiber Interruption**: Proves that unmounting cancels active in-flight fibers.

---

## 5. Verification Checklist

1. `bun run typecheck` (`tsc --noEmit -p tsconfig.legend.json`): **0 errors**.
2. `bun run test` (`jest --no-watchman`): **All test suites pass**.
3. `npx -y react-doctor@latest apps/skillet`: **100 / 100 Great**.
4. `bun scripts/release.ts`: **macOS release .app and .zip successfully built**.
