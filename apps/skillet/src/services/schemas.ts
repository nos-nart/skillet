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
  mode: Schema.optionalKey(Schema.String),
  type: Schema.String,
  sha: Schema.optionalKey(Schema.String),
  size: Schema.optionalKey(Schema.Number),
  url: Schema.optionalKey(Schema.String),
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
