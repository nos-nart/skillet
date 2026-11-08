const path = require("path");

module.exports = {
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  modulePathIgnorePatterns: [
    "<rootDir>/.repos/",
    "<rootDir>/.spark/",
    "<rootDir>/spark-packages/",
    "<rootDir>/macos/",
    "<rootDir>/dist/",
    "<rootDir>/build/",
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        babelrc: false,
        configFile: false,
        presets: [
          ["@babel/preset-react", { runtime: "automatic" }],
          "@babel/preset-typescript",
        ],
        plugins: [
          path.resolve(__dirname, "jest/transformImportMeta.cjs"),
          "@babel/plugin-transform-export-namespace-from",
          "@babel/plugin-transform-modules-commonjs",
        ],
      },
    ],
  },
  moduleNameMapper: {
    "^react-native$": "<rootDir>/jest/reactNativeMock.cjs",
    "^@legendapp/spark/ui/symbol$": "<rootDir>/jest/sfSymbolMock.cjs",
    "^@legendapp/spark/(dialogs|windows|files|processes|clipboard|settings)$": "<rootDir>/jest/sparkMocks.cjs",
    "^@legendapp/list/react-native$": "<rootDir>/jest/legendListMock.cjs",
    "^react-native-enriched-markdown$": "<rootDir>/jest/enrichedMarkdownMock.cjs",
    "^uniwind$": "<rootDir>/jest/uniwindMock.cjs",
  },
  transformIgnorePatterns: [
    "node_modules/(?!(?:\\.bun/[^/]+/node_modules/)?(?:@effect/atom-react|effect))",
  ],
};
