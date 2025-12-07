import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@/": `${resolve(__dirname, "src")}/`,
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    environment: "node",
    environmentMatchGlobs: [
      ["src/**", "jsdom"],
    ],
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    pool: "threads",
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
