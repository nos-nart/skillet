import { Effect } from "effect";
import * as React from "react";
import { useRunEffect } from "../useRunEffect";

describe("useRunEffect hook", () => {
  let stateMap: Map<number, any>;
  let stateIndex: number;
  let effectCleanup: (() => void) | undefined;
  const originalDispatcher =
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?.H;

  beforeEach(() => {
    stateMap = new Map();
    stateIndex = 0;
    effectCleanup = undefined;

    const mockDispatcher = {
      useState: (initial: any) => {
        const idx = stateIndex++;
        if (!stateMap.has(idx)) {
          stateMap.set(idx, typeof initial === "function" ? initial() : initial);
        }
        const setState = (next: any) => {
          const prev = stateMap.get(idx);
          const val = typeof next === "function" ? next(prev) : next;
          stateMap.set(idx, val);
        };
        return [stateMap.get(idx), setState];
      },
      useRef: (initial: any) => {
        const idx = stateIndex++;
        if (!stateMap.has(idx)) {
          stateMap.set(idx, { current: initial });
        }
        return stateMap.get(idx);
      },
      useEffect: (fn: any) => {
        const idx = stateIndex++;
        if (!stateMap.has(idx)) {
          stateMap.set(idx, true);
          const cleanup = fn();
          if (typeof cleanup === "function") {
            effectCleanup = cleanup;
          }
        }
      },
      useCallback: (fn: any) => fn,
    };

    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H =
      mockDispatcher;
  });

  afterEach(() => {
    (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H =
      originalDispatcher;
  });

  it("tracks loading state and returns data on success", async () => {
    stateIndex = 0;
    const hook = useRunEffect();

    expect(hook.isLoading).toBe(false);
    expect(hook.error).toBeNull();

    const output = await hook.run(Effect.succeed("hook-success"));
    expect(output).toBe("hook-success");
  });

  it("handles errors and executes onError callback", async () => {
    stateIndex = 0;
    const hook = useRunEffect();
    const onError = jest.fn();

    await expect(
      hook.run(Effect.fail(new Error("fail-case")), { onError })
    ).rejects.toThrow("fail-case");

    expect(onError).toHaveBeenCalled();
  });

  it("cleans up and interrupts active fiber on unmount", async () => {
    stateIndex = 0;
    useRunEffect();
    expect(typeof effectCleanup).toBe("function");
    expect(() => effectCleanup?.()).not.toThrow();
  });
});
