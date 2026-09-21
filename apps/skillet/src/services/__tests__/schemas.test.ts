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
