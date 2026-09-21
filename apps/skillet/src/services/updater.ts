import { downloadSkill } from "./skills";
import type { Skill } from "./skills";
import { fetchLatestCommit, loadSkillsLock, type FetchFn } from "./github";

// Port of `checkSkillUpdates` (`src/backend/updater.ts`): diffs each installed
// GitHub package against its lockfile SHA, flagging packages whose remote HEAD
// moved. Returns packageName -> updateAvailable.
export async function checkSkillUpdates(
  skills: Skill[],
  opts: { token?: string; fetchImpl?: FetchFn } = {},
): Promise<Record<string, boolean>> {
  const lock = await loadSkillsLock();
  const updates: Record<string, boolean> = {};

  const packages = new Set<string>();
  for (const skill of skills) {
    if (skill.packageName && skill.packageName !== "Global skills") {
      packages.add(skill.packageName);
    }
  }

  await Promise.all(
    [...packages].map(async (pkg) => {
      try {
        const remoteSha = await fetchLatestCommit(pkg, opts.token, opts.fetchImpl);
        if (!remoteSha) return;
        const localSha = lock[pkg]?.commitSha;
        updates[pkg] =
          !localSha ||
          localSha.trim() === "" ||
          localSha.trim().toLowerCase() !== remoteSha.trim().toLowerCase();
      } catch {
        // One failing package must not block the rest.
      }
    }),
  );

  return updates;
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
