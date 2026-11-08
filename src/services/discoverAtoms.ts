import * as Effect from "effect/Effect";
import * as Atom from "effect/unstable/reactivity/Atom";
import {
  browseRepoForSkillsEffect,
  parseGitHubRepo,
  type BrowseRepoResult,
  type FetchFn,
} from "./github";
import {
  GitHubNetworkError,
  GitHubRateLimitError,
  InvalidRepoFormatError,
  RepoNotFoundError,
} from "./errors";

export interface BrowseRepoQueryInput {
  readonly query: string;
  readonly token?: string;
  readonly fetchImpl?: FetchFn;
}

export const browseRepoSkillsQueryEffect = (
  input: BrowseRepoQueryInput,
): Effect.Effect<
  BrowseRepoResult,
  InvalidRepoFormatError | GitHubRateLimitError | RepoNotFoundError | GitHubNetworkError
> =>
  Effect.gen(function* () {
    const trimmed = input.query.trim();
    if (trimmed === "") {
      return yield* Effect.fail(
        new InvalidRepoFormatError({ message: "Please enter a repository name." }),
      );
    }
    const info = parseGitHubRepo(trimmed);
    if (!info) {
      return yield* Effect.fail(
        new InvalidRepoFormatError({
          message: "Invalid format. Use owner/repo or a GitHub URL.",
        }),
      );
    }
    return yield* browseRepoForSkillsEffect(info, {
      token: input.token,
      fetchImpl: input.fetchImpl,
    });
  });

export const browseRepoAtom = Atom.fn((input: BrowseRepoQueryInput) =>
  browseRepoSkillsQueryEffect(input),
);

export const installingSkillAtom = Atom.make<string | null>(null);

export function formatDiscoverError(err: unknown): string {
  if (err instanceof GitHubRateLimitError) {
    return "GitHub API rate limit exceeded. Add a GitHub Personal Access Token in Settings to continue.";
  }
  if (err instanceof RepoNotFoundError) {
    return err.message || `Repository not found: ${err.owner}/${err.repo}`;
  }
  if (err instanceof GitHubNetworkError) {
    return `Network connection error: ${err.message}`;
  }
  if (err instanceof InvalidRepoFormatError) {
    return err.message || "Invalid format. Use owner/repo or a GitHub URL.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  if (typeof err === "string") {
    return err;
  }
  return "Failed to load skills from repository.";
}
