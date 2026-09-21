// SF Symbol tests render nothing (mirrors legend-apps' own
// `SFSymbol: () => null` test mocks); components are never rendered in unit
// tests — only services and reducers are exercised.
module.exports = {
  SFSymbol: () => null,
  SFSymbolPlaceholder: () => null,
};
