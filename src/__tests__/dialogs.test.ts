import { targetDirFor } from "../dialogs";

test("targetDirFor returns undefined for global scope", () => {
  expect(targetDirFor({ kind: "global" }, "turborepo")).toBeUndefined();
});

test("targetDirFor resolves workspace .skills/<slug> path", () => {
  expect(
    targetDirFor({ kind: "workspace", path: "/Users/dev/project", name: "project" }, "turborepo"),
  ).toBe("/Users/dev/project/.skills/turborepo");
});

test("targetDirFor resolves custom folder <path>/<slug>", () => {
  expect(targetDirFor({ kind: "folder", path: "/Users/dev/custom-skills" }, "turborepo")).toBe(
    "/Users/dev/custom-skills/turborepo",
  );
});
