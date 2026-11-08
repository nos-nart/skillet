const { withUniwindConfig } = require("uniwind/metro");
const { metroConfig } = require("@legendapp/spark/metro");

module.exports = withUniwindConfig(metroConfig(__dirname), {
  cssEntryFile: "./global.css",
  dtsFile: "./src/uniwind-types.d.ts",
});
