import * as Effect from "effect/Effect";
import { SkillsShNetworkError } from "./errors";
import { defaultFetch, type FetchFn } from "./github";

export const SKILLS_SH_API_BASE = "https://skills.sh";
export const SKILLS_SH_MIN_QUERY = 2;
export const SKILLS_SH_RESULT_LIMIT = 20;

export interface SkillsShItem {
  id: string;
  skillId: string;
  name: string;
  source: string;
  installs: number;
}

export interface SearchSkillsShOptions {
  limit?: number;
  owner?: string;
  fetchImpl?: FetchFn;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toItem(entry: unknown): SkillsShItem | null {
  if (!isRecord(entry)) return null;
  const id = typeof entry.id === "string" ? entry.id : "";
  const skillId = typeof entry.skillId === "string" ? entry.skillId : "";
  const name = typeof entry.name === "string" && entry.name !== "" ? entry.name : skillId;
  const source = typeof entry.source === "string" ? entry.source : "";
  const installs = typeof entry.installs === "number" ? entry.installs : 0;
  if (id === "" || skillId === "") return null;
  return { id, skillId, name, source, installs };
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
    const trimmed = query.trim();
    if (trimmed.length < SKILLS_SH_MIN_QUERY) return [];

    const fetchImpl = options.fetchImpl ?? defaultFetch;
    const params = new URLSearchParams({
      q: trimmed,
      limit: String(options.limit ?? SKILLS_SH_RESULT_LIMIT),
    });
    if (options.owner) params.set("owner", options.owner);

    const response = yield* Effect.tryPromise({
      try: () => fetchImpl(`${SKILLS_SH_API_BASE}/api/search?${params.toString()}`),
      catch: (err) =>
        new SkillsShNetworkError({
          message: err instanceof Error ? err.message : String(err),
        }),
    });
    if (!response.ok) {
      return yield* Effect.fail(
        new SkillsShNetworkError({ message: `skills.sh search failed for "${trimmed}".` }),
      );
    }
    const payload = yield* Effect.tryPromise({
      try: () => response.json(),
      catch: (err) =>
        new SkillsShNetworkError({
          message: err instanceof Error ? err.message : String(err),
        }),
    });
    const entries = isRecord(payload) && Array.isArray(payload.skills) ? payload.skills : null;
    if (!entries) {
      return yield* Effect.fail(
        new SkillsShNetworkError({ message: `skills.sh returned an unexpected response.` }),
      );
    }
    return entries
      .map(toItem)
      .filter((item): item is SkillsShItem => item !== null)
      .sort((a, b) => b.installs - a.installs);
  });

export type SearchSkillsShResult =
  | { ok: true; items: SkillsShItem[] }
  | { ok: false; error: string };

export async function searchSkillsSh(
  query: string,
  options: SearchSkillsShOptions = {},
): Promise<SearchSkillsShResult> {
  return Effect.runPromise(
    searchSkillsShEffect(query, options).pipe(
      Effect.map((items) => ({ ok: true as const, items })),
      Effect.catch((err) => Effect.succeed({ ok: false as const, error: err.message })),
    ),
  );
}
