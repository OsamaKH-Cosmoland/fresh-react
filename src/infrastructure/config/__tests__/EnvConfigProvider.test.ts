import { fileURLToPath } from "url";
import { EnvConfigProvider } from "../EnvConfigProvider";

describe("EnvConfigProvider", () => {
  it("prefers provided env values", () => {
    const provider = new EnvConfigProvider({ env: { TEST_VALUE: "hello" } });
    expect(provider.get("TEST_VALUE")).toBe("hello");
    expect(provider.getNumber("TEST_VALUE")).toBeUndefined();
    expect(provider.getBoolean("TEST_VALUE")).toBeUndefined();
  });

  it("loads telegram credentials from a JSON file", () => {
    const configPath = new URL("./fixtures/telegram.fixture.json", import.meta.url);
    const provider = new EnvConfigProvider({
      jsonFiles: { TELEGRAM_CONFIG: configPath },
    });
    expect(provider.get("TELEGRAM_BOT_TOKEN")).toBe("fixture-token");
    expect(provider.get("TELEGRAM_CHAT_ID")).toBe("fixture-chat");
    expect(provider.getObject("TELEGRAM_CONFIG")).toMatchObject({
      botToken: "fixture-token",
      chatId: "fixture-chat",
    });
  });

  it("exposes explicit path entries", () => {
    const fallbackPath = new URL("./fixtures/orders-fallback.fixture.json", import.meta.url);
    const provider = new EnvConfigProvider({
      pathFiles: { ORDERS_FALLBACK_PATH: fallbackPath },
    });
    expect(provider.get("ORDERS_FALLBACK_PATH")).toBe(fileURLToPath(fallbackPath));
  });
});
