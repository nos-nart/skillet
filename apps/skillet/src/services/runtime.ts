import * as ManagedRuntime from "effect/ManagedRuntime";
import * as Layer from "effect/Layer";
import type * as Effect from "effect/Effect";

// Base application layer (augmented as services are migrated)
export const AppLiveLayer = Layer.empty;
export type AppServices = Layer.Success<typeof AppLiveLayer>;

export const skilletRuntime = ManagedRuntime.make(AppLiveLayer);

export const runEffect = <A, E>(
  effect: Effect.Effect<A, E, AppServices>,
): Promise<A> => skilletRuntime.runPromise(effect);
