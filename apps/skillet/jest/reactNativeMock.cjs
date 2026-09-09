// Minimal react-native stand-in for unit tests: services must not pull the
// Flow-typed react-native runtime into jest (copied from
// packages/skills-fs/jest/reactNativeMock.cjs). View/Text/Pressable/StyleSheet
// stubs cover the Task 5 screens (SkillList/Sidebar import them at module
// scope); Switch/Modal/TextInput/ScrollView cover the Task 6 detail + dialogs;
// Alert/Image/Linking cover the Task 7 discover tab + source-URL row;
// components are never rendered in unit tests.
const React = require("react");

const createComponent = (name) => (
  React.forwardRef(({ children, ...props }, ref) => React.createElement(name, { ...props, ref }, children))
);

module.exports = {
  TurboModuleRegistry: {
    getEnforcing: () => ({}),
    get: () => null,
  },
  Platform: { OS: "macos", select: (values) => values.macos ?? values.native ?? values.default },
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
  },
  View: createComponent("View"),
  Text: createComponent("Text"),
  Pressable: createComponent("Pressable"),
  Switch: createComponent("Switch"),
  Modal: createComponent("Modal"),
  TextInput: createComponent("TextInput"),
  ScrollView: createComponent("ScrollView"),
  Image: createComponent("Image"),
  Alert: { alert: () => {} },
  Linking: { openURL: async () => true, canOpenURL: async () => true },
};
