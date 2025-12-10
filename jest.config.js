import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** @type {import("jest").Config} **/
const config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "jsdom",
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|webp|avif|svg)$": "<rootDir>/__mocks__/fileMock.cjs",
    "\\.(css|scss|sass)$": "<rootDir>/__mocks__/styleMock.cjs",
    "^mongodb$": "<rootDir>/__mocks__/mongodbMock.cjs",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "cjs", "json", "node"],
};

export default config;
