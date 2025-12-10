import "@testing-library/jest-dom";
import { jest as jestGlobals } from "@jest/globals";

if (typeof globalThis.jest === "undefined") {
  globalThis.jest = jestGlobals;
}
