import { validateSafeSlug } from "../index";

test("rejects traversal slugs", () => {
  expect(validateSafeSlug("..")).toBe(false);
  expect(validateSafeSlug("a/b")).toBe(false);
  expect(validateSafeSlug("ok-slug_1.2")).toBe(true);
});
