import { createStorage } from "@legend-apps/storage";
import {
  addWorkspace,
  getBookmarks,
  getWorkspaces,
  removeWorkspace,
  saveBookmarks,
  setCurrentWorkspace,
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
