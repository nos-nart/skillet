import * as Effect from "effect/Effect";
import { downloadSkill } from "./skills";
import type { Skill } from "./skills";
import { fetchLatestCommit, loadSkillsLock, type FetchFn, type SkillsLock } from "./github";

// Port of `checkSkillUpdates` (`src/backend/updater.ts`): diffs each installed
// GitHub package against its lockfile SHA, flagging packages whose remote HEAD
// moved. Returns packageName -> updateAvailable.
export const checkSkillUpdatesEffect = (
  skills: Skill[],
  opts: { token?: string; fetchImpl?: FetchFn } = {},
): Effect.Effect<Record<string, boolean>, never> =>
  Effect.gen(function* () {
    const lock = yield* Effect.promise(() => loadSkillsLock().catch((): SkillsLock => ({})));
    const updates: Record<string, boolean> = {};

    const packages = new Set<string>();
    for (const skill of skills) {
      if (skill.packageName && skill.packageName !== "Global skills") {
        packages.add(skill.packageName);
      }
    }

    const checkPackage = (pkg: string) =>
      Effect.gen(function* () {
        const remoteSha = yield* Effect.tryPromise({
          try: () => fetchLatestCommit(pkg, opts.token, opts.fetchImpl),
          catch: () => null,
        });
        if (!remoteSha) return null;
        const localSha = lock[pkg]?.commitSha;
        const hasUpdate =
          !localSha ||
          localSha.trim() === "" ||
          localSha.trim().toLowerCase() !== remoteSha.trim().toLowerCase();
        return { pkg, hasUpdate };
      }).pipe(
        // Per-item failure isolation: one failing package must not block the rest.
        Effect.orElseSucceed(() => null),
      );

    const results = yield* Effect.all(
      [...packages].map(checkPackage),
      { concurrency: 5 },
    );

    for (const item of results) {
      if (item) {
        updates[item.pkg] = item.hasUpdate;
      }
    }

    return updates;
  });

export async function checkSkillUpdates(
  skills: Skill[],
  opts: { token?: string; fetchImpl?: FetchFn } = {},
): Promise<Record<string, boolean>> {
  return Effect.runPromise(checkSkillUpdatesEffect(skills, opts));
}

// Port of the old `handleUpdateSkill`: reinstalls from the recorded package
// source (lock parity — `downloadSkill` refreshes the lock SHA on success).
export async function updateSkill(
  skill: Skill,
  opts: { token?: string; fetchImpl?: FetchFn } = {},
): Promise<void> {
  const res = await downloadSkill(
    { source: skill.packageName, skillName: skill.slug, token: opts.token },
    { fetchImpl: opts.fetchImpl },
  );
  if (!res.ok) throw new Error(res.error);
}
