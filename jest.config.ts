import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|webp|avif|svg)$": "<rootDir>/__mocks__/fileMock.ts",
    "\\.(css|scss|sass)$": "<rootDir>/__mocks__/styleMock.ts",
    "^mongodb$": "<rootDir>/__mocks__/mongodbMock.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "cjs", "json", "node"],
  testEnvironmentOptions: {
    // Helps ESM modules that rely on URL/env-like behaviors
    customExportConditions: ["node", "browser", "default"],
    url: "http://localhost",
  },
};

export default config;
