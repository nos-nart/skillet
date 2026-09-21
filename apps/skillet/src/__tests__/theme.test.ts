import { skilletColors } from "../theme";

test("dark bg token exists", () => {
  expect(skilletColors.bgPrimaryDark).toBe("#191A1B");
});

test("primary brand tokens match Apple Blue", () => {
  expect(skilletColors.primaryLight).toBe("#007AFF");
  expect(skilletColors.primaryDark).toBe("#0A84FF");
});
