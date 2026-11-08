import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import { SkillsShNetworkError } from "./errors";
import { defaultFetch, type FetchFn } from "./github";
import { SkillsShSearchResponseSchema } from "./schemas";

export const SKILLS_SH_API_BASE = "https://skills.sh";
export const SKILLS_SH_MIN_QUERY = 2;

export interface SkillsShItem {
  id: string;
  skillId: string;
  name: string;
  source: string;
  installs: number;
}

export interface SearchSkillsShOptions {
  fetchImpl?: FetchFn;
}

/** skills.sh install URL for a search hit (parseGitHubRepo-compatible). */
export function skillsShUrl(item: Pick<SkillsShItem, "source" | "skillId">): string {
  return `https://skills.sh/${item.source}/${item.skillId}`;
}

export const searchSkillsShEffect = (
  query: string,
  options: SearchSkillsShOptions = {},
): Effect.Effect<SkillsShItem[], SkillsShNetworkError> =>
  Effect.gen(function* () {
    const q = query.trim();
    if (q.length < SKILLS_SH_MIN_QUERY) return [];

    const fetchFn = options.fetchImpl ?? defaultFetch;
    const url = `${SKILLS_SH_API_BASE}/api/search?q=${encodeURIComponent(q)}`;

    const res = yield* Effect.tryPromise({
      try: () => fetchFn(url, { headers: { Accept: "application/json" } }),
      catch: (err) =>
        new SkillsShNetworkError({
          message: err instanceof Error ? err.message : String(err),
        }),
    });
    if (!res.ok) {
      return yield* Effect.fail(
        new SkillsShNetworkError({
          status: res.status,
          message: `skills.sh request failed (${res.status ?? "HTTP error"}).`,
        }),
      );
    }

    const payload: unknown = yield* Effect.tryPromise({
      try: () => res.json(),
      catch: (err) =>
        new SkillsShNetworkError({
          message: err instanceof Error ? err.message : String(err),
        }),
    });
    const decoded = yield* Schema.decodeUnknownEffect(SkillsShSearchResponseSchema)(payload).pipe(
      Effect.mapError(
        () => new SkillsShNetworkError({ message: `skills.sh returned an unexpected response.` }),
      ),
    );
    return decoded.skills
      .map((entry): SkillsShItem => ({
        id: entry.id,
        skillId: entry.skillId,
        name: entry.name && entry.name !== "" ? entry.name : entry.skillId,
        source: entry.source ?? "",
        installs: entry.installs ?? 0,
      }))
      .sort((a, b) => b.installs - a.installs);
  });

export async function searchSkillsSh(
  query: string,
  options: SearchSkillsShOptions = {},
): Promise<{ ok: true; items: SkillsShItem[] } | { ok: false; error: string }> {
  return Effect.runPromise(
    searchSkillsShEffect(query, options).pipe(
      Effect.map((items) => ({ ok: true as const, items })),
      Effect.catchTag("SkillsShNetworkError", (e) =>
        Effect.succeed({ ok: false as const, error: e.message }),
      ),
    ),
  );
}
