import { groupByPackage } from "../SkillList";
test("groups by packageName", () => {
  expect(groupByPackage([{ packageName: "a" } as never]).get("a")?.length).toBe(1);
});
