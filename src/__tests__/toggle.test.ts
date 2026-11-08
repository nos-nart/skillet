import { toggleReducer } from "../SkillDetail";
test("optimistic enable", () => {
  expect(toggleReducer(new Set(), { workspaceId: "x", enable: true }).has("x")).toBe(true);
});

test("optimistic disable", () => {
  expect(toggleReducer(new Set(["x"]), { workspaceId: "x", enable: false }).has("x")).toBe(
    false,
  );
});
