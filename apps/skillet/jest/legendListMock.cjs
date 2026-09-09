// Unit-test stand-in for `@legendapp/list/react-native`: the real list pulls
// the react-native runtime (unavailable under jest). Only the component
// binding is stubbed — pure helpers like `groupByPackage` run for real.
function LegendList() {
  return null;
}

module.exports = {
  __esModule: true,
  LegendList,
};
