import { createStorage, hydrateStorage, resetStorageCacheForTests } from "../storage";

const sparkMocks = require("../../../jest/sparkMocks.cjs");

beforeEach(() => {
  resetStorageCacheForTests();
  sparkMocks.__resetSettingsStore();
});

test("reads and writes synchronously while persisting to Spark settings", async () => {
  const store = createStorage({ subfolder: "test-sub" });
  expect(store.read("settings.json")).toBeUndefined();
  store.write("settings.json", { theme: "light" });
  expect(store.read("settings.json")).toEqual({ theme: "light" });

  resetStorageCacheForTests();
  await hydrateStorage("test-sub");
  const hydrated = createStorage({ subfolder: "test-sub" });
  expect(hydrated.read("settings.json")).toEqual({ theme: "light" });
});
