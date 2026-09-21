import { useCallback, useEffect, useRef, useState } from "react";
import type * as Effect from "effect/Effect";
import * as Fiber from "effect/Fiber";
import { skilletRuntime, type AppServices } from "../services/runtime";

export interface RunEffectOptions<A, E> {
  onSuccess?: (value: A) => void;
  onError?: (error: E) => void;
}

export function useRunEffect() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const activeFiberRef = useRef<Fiber.Fiber<any, any> | null>(null);

  useEffect(() => {
    return () => {
      if (activeFiberRef.current) {
        skilletRuntime.runFork(Fiber.interrupt(activeFiberRef.current));
        activeFiberRef.current = null;
      }
    };
  }, []);

  const run = useCallback(
    async <A, E>(
      effect: Effect.Effect<A, E, AppServices>,
      options?: RunEffectOptions<A, E>,
    ): Promise<A> => {
      setIsLoading(true);
      setError(null);
      try {
        const fiber = skilletRuntime.runFork(effect);
        activeFiberRef.current = fiber;
        const result = await skilletRuntime.runPromise(Fiber.join(fiber));
        options?.onSuccess?.(result);
        return result;
      } catch (cause) {
        setError(cause);
        // SAFETY: The runtime fiber rejects with the effect's error channel type E
        options?.onError?.(cause as E);
        throw cause;
      } finally {
        setIsLoading(false);
        activeFiberRef.current = null;
      }
    },
    [],
  );

  return { run, isLoading, error };
}
