// Unit-test stand-in for `react-native-enriched-markdown`: the real module
// pulls codegen native components (unavailable under jest). Only the
// component binding is stubbed — `SkillDetail`'s pure helpers (e.g.
// `toggleReducer`) run for real. Same `moduleNameMapper` file-swap pattern as
// `legendListMock.cjs`; no test-file mocking.
const React = require("react");

const EnrichedMarkdownText = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement("EnrichedMarkdownText", { ...props, ref }, children),
);

const EnrichedMarkdownTextInput = React.forwardRef(({ children, ...props }, ref) =>
  React.createElement("EnrichedMarkdownTextInput", { ...props, ref }, children),
);

module.exports = {
  __esModule: true,
  EnrichedMarkdownText,
  EnrichedMarkdownTextInput,
};
