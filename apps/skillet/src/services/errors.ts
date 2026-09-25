import * as Schema from "effect/Schema";

export class GitHubRateLimitError extends Schema.TaggedError<GitHubRateLimitError>()(
  "GitHubRateLimitError",
  {
    message: Schema.String,
    resetAt: Schema.optionalKey(Schema.Number),
  },
) {}

export class RepoNotFoundError extends Schema.TaggedError<RepoNotFoundError>()(
  "RepoNotFoundError",
  {
    owner: Schema.String,
    repo: Schema.String,
    message: Schema.String,
  },
) {}

export class GitHubNetworkError extends Schema.TaggedError<GitHubNetworkError>()(
  "GitHubNetworkError",
  {
    message: Schema.String,
    status: Schema.optionalKey(Schema.UndefinedOr(Schema.Number)),
  },
) {}

export class InvalidSlugError extends Schema.TaggedError<InvalidSlugError>()(
  "InvalidSlugError",
  {
    slug: Schema.String,
  },
) {}

export class SkillsShNetworkError extends Schema.TaggedError<SkillsShNetworkError>()(
  "SkillsShNetworkError",
  {
    message: Schema.String,
  },
) {}

export class FsError extends Schema.TaggedError<FsError>()(
  "FsError",
  {
    operation: Schema.String,
    path: Schema.String,
    message: Schema.String,
  },
) {}

export class SkillParseError extends Schema.TaggedError<SkillParseError>()(
  "SkillParseError",
  {
    path: Schema.String,
    message: Schema.String,
  },
) {}

export class InvalidRepoFormatError extends Schema.TaggedError<InvalidRepoFormatError>()(
  "InvalidRepoFormatError",
  {
    message: Schema.String,
  },
) {}

