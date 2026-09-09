// Minimal react-native stand-in for unit tests: the slug guard and other
// pure helpers must not pull the Flow-typed react-native runtime into jest.
module.exports = {
  TurboModuleRegistry: {
    getEnforcing: () => ({}),
    get: () => null,
  },
  Platform: { OS: "macos" },
};
