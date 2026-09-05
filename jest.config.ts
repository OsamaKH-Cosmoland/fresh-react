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
    // Jest's ESM resolver strips the query before applying these patterns, so
    // imagetools imports ("./x.jpg?...&as=picture") arrive here as plain "./x.jpg".
    // Every bundled image now goes through assets/images.ts, so they all need the
    // picture-shaped stub; svg is unused today but keeps its string stub.
    "\\.(jpg|jpeg|png|gif|webp|avif)$": "<rootDir>/__mocks__/imageMock.ts",
    "\\.svg$": "<rootDir>/__mocks__/fileMock.ts",
    "\\.(css|scss|sass)$": "<rootDir>/__mocks__/styleMock.ts",
    "^mongodb$": "<rootDir>/__mocks__/mongodbMock.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "cjs", "json", "node"],
  testEnvironmentOptions: {
    // Helps ESM modules that rely on URL/env-like behaviors
    customExportConditions: ["node", "browser", "default"],
    url: "http://localhost",
  },
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 50,
      functions: 70,
      lines: 70,
    },
    "src/domain/": {
      statements: 90,
      branches: 70,
      functions: 90,
      lines: 85,
    },
    "src/application/": {
      statements: 85,
      branches: 60,
      functions: 85,
      lines: 85,
    },
  },
};

export default config;
