// Minimal react-native stand-in for unit tests: services must not pull the
// Flow-typed react-native runtime into jest (copied from
// packages/skills-fs/jest/reactNativeMock.cjs).
module.exports = {
  TurboModuleRegistry: {
    getEnforcing: () => ({}),
    get: () => null,
  },
  Platform: { OS: "macos" },
};
