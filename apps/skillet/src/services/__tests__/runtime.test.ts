import { Effect } from "effect";
import { runEffect, skilletRuntime } from "../runtime";

describe("Managed Application Runtime", () => {
  it("executes effect with runtime services", async () => {
    const testEffect = Effect.succeed("runtime-active");
    const result = await runEffect(testEffect);
    expect(result).toBe("runtime-active");
  });

  it("handles effect failures via promise rejection", async () => {
    const failingEffect = Effect.fail(new Error("runtime-error"));
    await expect(runEffect(failingEffect)).rejects.toThrow("runtime-error");
  });
});
