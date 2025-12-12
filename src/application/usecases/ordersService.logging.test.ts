import type { Logger } from "@/domain/logging/Logger";
import { notifyTelegram } from "./ordersService";
import { setLogger, getLogger } from "@/logging/globalLogger";
import { StaticConfigProvider } from "../../infrastructure/config/StaticConfigProvider";
import { SimpleFeatureFlagProvider } from "../../infrastructure/config/SimpleFeatureFlagProvider";
import { TestLogger } from "../../infrastructure/logging/TestLogger";

describe("ordersService logging", () => {
  let originalLogger: Logger;

  beforeEach(() => {
    originalLogger = getLogger();
  });

  afterEach(() => {
    setLogger(originalLogger);
  });

  it("logs Telegram notify failures when config is missing", async () => {
    const logger = new TestLogger();
    setLogger(logger);
    const configProvider = new StaticConfigProvider({
      values: { FEATURE_TELEGRAM_NOTIFICATIONS: "true" },
    });
    const flagProvider = new SimpleFeatureFlagProvider(configProvider, {
      defaults: { TELEGRAM_NOTIFICATIONS: true },
    });
    const sampleOrder = {
      orderCode: "TEST-LOG",
      customer: { name: "Logger", phone: "+201000000000" },
      total: 5,
      createdAt: new Date().toISOString(),
    };

    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result.ok).toBe(false);
    const errorEntry = logger.getEntries().find((entry) => entry.level === "error");
    expect(errorEntry).toBeDefined();
    expect(errorEntry?.message).toContain("Telegram notify error");
  });
});
