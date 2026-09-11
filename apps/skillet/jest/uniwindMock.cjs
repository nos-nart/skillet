// Unit-test stand-in for `uniwind`: the real module reads the native
// color-scheme TurboModule at import time (unavailable under jest), which
// breaks any suite importing `SkillDetail` (e.g. `toggle.test.ts` exercises
// the pure `toggleReducer` through it). Only `useUniwind` is stubbed —
// defaulting to the light theme; tests needing dark can `jest.mock` over it.
// Same `moduleNameMapper` file-swap pattern as `enrichedMarkdownMock.cjs`.
module.exports = {
  __esModule: true,
  useUniwind: () => ({ theme: "light" }),
};
