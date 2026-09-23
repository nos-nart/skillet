import { Effect } from "effect";
import { createStorage } from "@legend-apps/storage";
import {
  addWorkspace,
  addWorkspaceEffect,
  getBookmarks,
  getWorkspaces,
  removeWorkspace,
  removeWorkspaceEffect,
  saveBookmarks,
  saveBookmarksEffect,
  setCurrentWorkspace,
  setCurrentWorkspaceEffect,
  storageJsonStore,
  type JsonStore,
  type Workspace,
} from "../workspaces";

function testStore(name: string): JsonStore {
  // SAFETY: test-only subfolder keeps suites isolated
  return storageJsonStore(createStorage({ root: "applicationSupport", subfolder: name }) as never);
}

const ws = (over: Partial<Workspace> & { id: string }): Workspace => ({
  name: over.id,
  path: `/ws/${over.id}`,
  ...over,
});

test("defaults to Global Scope when empty", async () => {
  await expect(getWorkspaces(testStore("skillet-test-ws-default"))).resolves.toEqual([
    { id: "global", name: "Global Scope", path: "~/.skills", isCurrent: true },
  ]);
});

test("adds workspaces and ignores duplicates", async () => {
  const store = testStore("skillet-test-ws-add");
  await addWorkspace(ws({ id: "proj", name: "Proj" }), store);
  await addWorkspace(ws({ id: "proj", name: "Proj" }), store);
  const list = await getWorkspaces(store);
  expect(list.filter((w) => w.id === "proj")).toHaveLength(1);
});

test("removes by id and restores global default when emptied", async () => {
  const store = testStore("skillet-test-ws-remove");
  await addWorkspace(ws({ id: "proj" }), store);
  await removeWorkspace("proj", store);
  await expect(getWorkspaces(store)).resolves.toEqual([
    { id: "global", name: "Global Scope", path: "~/.skills", isCurrent: true },
  ]);
});

test("setCurrentWorkspace flips isCurrent", async () => {
  const store = testStore("skillet-test-ws-current");
  await addWorkspace(ws({ id: "a" }), store);
  await addWorkspace(ws({ id: "b" }), store);
  await setCurrentWorkspace("b", store);
  const list = await getWorkspaces(store);
  expect(list.find((w) => w.id === "b")?.isCurrent).toBe(true);
  expect(list.find((w) => w.id !== "b")?.isCurrent).toBe(false);
});

test("bookmarks default empty and round-trip", async () => {
  const store = testStore("skillet-test-ws-bookmarks");
  await expect(getBookmarks(store)).resolves.toEqual([]);
  await saveBookmarks(["eli5", "acme/architect"], store);
  await expect(getBookmarks(store)).resolves.toEqual(["eli5", "acme/architect"]);
});

test("workspaces Effect mutations round-trip properly", async () => {
  const store = testStore("skillet-test-ws-effects");
  await Effect.runPromise(addWorkspaceEffect(ws({ id: "eff1", name: "Effect 1" }), store));
  await Effect.runPromise(setCurrentWorkspaceEffect("eff1", store));

  let list = await getWorkspaces(store);
  expect(list.find((w) => w.id === "eff1")?.isCurrent).toBe(true);

  await Effect.runPromise(saveBookmarksEffect(["eff-bookmark"], store));
  const bms = await getBookmarks(store);
  expect(bms).toEqual(["eff-bookmark"]);

  await Effect.runPromise(removeWorkspaceEffect("eff1", store));
  list = await getWorkspaces(store);
  expect(list.some((w) => w.id === "eff1")).toBe(false);
});
