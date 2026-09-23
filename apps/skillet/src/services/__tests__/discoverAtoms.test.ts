import * as Effect from "effect/Effect";
import * as Cause from "effect/Cause";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AtomRegistry from "effect/unstable/reactivity/AtomRegistry";
import {
  browseRepoSkillsQueryEffect,
  browseRepoAtom,
  installingSkillAtom,
  formatDiscoverError,
} from "../discoverAtoms";
import {
  GitHubNetworkError,
  GitHubRateLimitError,
  InvalidRepoFormatError,
  RepoNotFoundError,
} from "../errors";
import type { FetchFn } from "../github";

describe("discoverAtoms", () => {
  describe("browseRepoSkillsQueryEffect", () => {
    it("fails with InvalidRepoFormatError for empty query", async () => {
      const exit = await Effect.runPromiseExit(
        browseRepoSkillsQueryEffect({ query: "   " }),
      );
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        const error = Cause.squash(exit.cause);
        expect(error).toBeInstanceOf(InvalidRepoFormatError);
        expect((error as InvalidRepoFormatError).message).toBe(
          "Please enter a repository name.",
        );
      }
    });

    it("fails with InvalidRepoFormatError for invalid repo string", async () => {
      const exit = await Effect.runPromiseExit(
        browseRepoSkillsQueryEffect({ query: "invalid-single-token" }),
      );
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure") {
        const error = Cause.squash(exit.cause);
        expect(error).toBeInstanceOf(InvalidRepoFormatError);
        expect((error as InvalidRepoFormatError).message).toBe(
          "Invalid format. Use owner/repo or a GitHub URL.",
        );
      }
    });

    it("succeeds with repo and discovered items for valid repo query", async () => {
      const fetchImpl: FetchFn = (url) => {
        if (url.endsWith("/repos/owner/repo")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ default_branch: "main" }),
            text: () => Promise.resolve(""),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tree: [{ type: "blob", path: "skills/test/SKILL.md" }],
            }),
          text: () => Promise.resolve(""),
        });
      };

      const result = await Effect.runPromise(
        browseRepoSkillsQueryEffect({
          query: "owner/repo",
          fetchImpl,
        }),
      );

      expect(result.repo.owner).toBe("owner");
      expect(result.repo.repo).toBe("repo");
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.name).toBe("test");
      expect(result.items[0]?.path).toBe("skills/test");
    });
  });

  describe("browseRepoAtom & AtomRegistry", () => {
    it("tracks initial, in-flight, success, and reset states", async () => {
      const registry = AtomRegistry.make();
      const initialVal = registry.get(browseRepoAtom);
      expect(initialVal._tag).toBe("Initial");
      expect(initialVal.waiting).toBe(false);

      const fetchImpl: FetchFn = (url) => {
        if (url.endsWith("/repos/owner/repo")) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ default_branch: "main" }),
            text: () => Promise.resolve(""),
          });
        }
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              tree: [{ type: "blob", path: "skills/demo/SKILL.md" }],
            }),
          text: () => Promise.resolve(""),
        });
      };

      // Subscribe to observe lifecycle
      const states: string[] = [];
      const unsubscribe = registry.subscribe(browseRepoAtom, (res) => {
        states.push(res._tag);
      });

      registry.set(browseRepoAtom, {
        query: "owner/repo",
        fetchImpl,
      });

      // Wait briefly for the async effect to complete
      await new Promise((r) => setTimeout(r, 50));

      const successVal = registry.get(browseRepoAtom);
      expect(successVal._tag).toBe("Success");
      if (successVal._tag === "Success") {
        expect(successVal.value.repo.owner).toBe("owner");
        expect(successVal.value.items).toHaveLength(1);
      }

      // Reset
      registry.set(browseRepoAtom, Atom.Reset);
      const resetVal = registry.get(browseRepoAtom);
      expect(resetVal._tag).toBe("Initial");
      expect(resetVal.waiting).toBe(false);

      unsubscribe();
    });

    it("manages installingSkillAtom", () => {
      const registry = AtomRegistry.make();
      expect(registry.get(installingSkillAtom)).toBeNull();
      registry.set(installingSkillAtom, "skills/test");
      expect(registry.get(installingSkillAtom)).toBe("skills/test");
      registry.set(installingSkillAtom, null);
      expect(registry.get(installingSkillAtom)).toBeNull();
    });
  });

  describe("formatDiscoverError", () => {
    it("formats GitHubRateLimitError", () => {
      const err = new GitHubRateLimitError({ message: "Rate limit" });
      expect(formatDiscoverError(err)).toContain("rate limit exceeded");
    });

    it("formats RepoNotFoundError", () => {
      const err = new RepoNotFoundError({
        owner: "anthropics",
        repo: "skills",
        message: "Not found",
      });
      expect(formatDiscoverError(err)).toBe("Not found");
    });

    it("formats GitHubNetworkError", () => {
      const err = new GitHubNetworkError({ message: "Network offline" });
      expect(formatDiscoverError(err)).toBe("Network connection error: Network offline");
    });

    it("formats InvalidRepoFormatError", () => {
      const err = new InvalidRepoFormatError({ message: "Custom format message" });
      expect(formatDiscoverError(err)).toBe("Custom format message");
    });

    it("formats standard Error", () => {
      const err = new Error("Generic failure");
      expect(formatDiscoverError(err)).toBe("Generic failure");
    });

    it("formats unknown errors with fallback message", () => {
      expect(formatDiscoverError(12345)).toBe("Failed to load skills from repository.");
    });
  });
});
