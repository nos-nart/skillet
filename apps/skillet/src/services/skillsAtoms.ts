import * as Effect from "effect/Effect";
import * as Atom from "effect/unstable/reactivity/Atom";
import { listSkillsEffect, type Skill } from "./skills";
import type { FsError } from "./errors";

export const fetchSkillsAtom = Atom.fn(
  (dirs?: readonly string[]): Effect.Effect<Skill[], FsError> => listSkillsEffect(dirs),
);
