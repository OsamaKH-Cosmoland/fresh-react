import "@testing-library/jest-dom";
import { jest as jestGlobals } from "@jest/globals";
import { setAnalyticsClient } from "@/analytics/client";
import { InMemoryAnalyticsClient } from "@/infrastructure/analytics/InMemoryAnalyticsClient";
import { setLogger } from "@/logging/globalLogger";
import { NullLogger } from "@/infrastructure/logging";

if (typeof globalThis.jest === "undefined") {
  globalThis.jest = jestGlobals;
}

const testAnalyticsClient = new InMemoryAnalyticsClient();
setAnalyticsClient(testAnalyticsClient);

setLogger(new NullLogger());

declare global {
  var __TEST_ANALYTICS_CLIENT__: InMemoryAnalyticsClient | undefined;
}

globalThis.__TEST_ANALYTICS_CLIENT__ = testAnalyticsClient;
