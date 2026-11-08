import { Effect } from "effect";

describe("Effect v4 Sanity", () => {
  it("executes a simple synchronous effect", () => {
    const program = Effect.succeed(42);
    const result = Effect.runSync(program);
    expect(result).toBe(42);
  });

  it("executes an asynchronous promise effect", async () => {
    const program = Effect.promise(() => Promise.resolve("skillet"));
    const result = await Effect.runPromise(program);
    expect(result).toBe("skillet");
  });
});
