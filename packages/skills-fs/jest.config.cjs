module.exports = {
  rootDir: __dirname,
  testMatch: ["<rootDir>/src/**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": [
      "babel-jest",
      {
        babelrc: false,
        configFile: false,
        presets: ["@babel/preset-typescript"],
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    ],
  },
  moduleNameMapper: {
    "^react-native$": "<rootDir>/jest/reactNativeMock.cjs",
  },
};
