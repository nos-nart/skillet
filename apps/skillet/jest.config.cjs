module.exports = {
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
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
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    ],
  },
  moduleNameMapper: {
    "^react-native$": "<rootDir>/jest/reactNativeMock.cjs",
    "^@legend-apps/sf-symbol$": "<rootDir>/jest/sfSymbolMock.cjs",
    "^@legendapp/list/react-native$": "<rootDir>/jest/legendListMock.cjs",
    "^react-native-enriched-markdown$": "<rootDir>/jest/enrichedMarkdownMock.cjs",
    "^uniwind$": "<rootDir>/jest/uniwindMock.cjs",
    "^@legend-apps/storage$": "<rootDir>/src/services/__tests__/storageMock.ts",
  },
};
