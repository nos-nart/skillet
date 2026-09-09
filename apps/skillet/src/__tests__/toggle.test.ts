import { toggleReducer } from "../SkillDetail";
test("optimistic enable", () => {
  expect(toggleReducer(new Set(), { slug: "x", enable: true }).has("x")).toBe(true);
});
