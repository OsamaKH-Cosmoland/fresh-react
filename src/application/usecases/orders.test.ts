import { InMemoryOrdersRepository } from "../../infrastructure/repositories/InMemoryOrdersRepository";
import { createOrder, notifyTelegram, notifyTelegramTest, sanitizeOrderPayload } from "./orders";
import { FakeEmailProvider } from "../../infrastructure/email/fakeEmailProvider";
import https from "https";
import { EventEmitter } from "events";
import { ObjectId } from "mongodb";
import { FakeNotificationService } from "../../infrastructure/notifications/FakeNotificationService";
import { StaticConfigProvider } from "../../infrastructure/config/StaticConfigProvider";
import { SimpleFeatureFlagProvider } from "../../infrastructure/config/SimpleFeatureFlagProvider";

const originalFetch = global.fetch;
const fakeFetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  statusText: "OK",
  text: async () => "",
});

const buildPayload = (overrides: any = {}) => ({
  paymentMethod: "cash_on_delivery",
  status: "pending",
  totals: { items: 1, subtotal: 100, subTotal: 100, shipping: 0, currency: "EGP" },
  customer: {
    name: "Test User",
    email: "test@example.com",
    phone: "+201000000000",
    address: "123 St",
    city: "Cairo",
    notes: "",
  },
  items: [
    {
      id: "prod-1",
      title: "Sample Item",
      quantity: 1,
      unitPrice: "100",
      variant: { name: "std", label: "std", size: "std", price: 100, currency: "EGP" },
    },
  ],
  ...overrides,
});

describe("createOrder service", () => {
  beforeAll(() => {
    global.fetch = fakeFetch as any;
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("creates an order with the repository", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    const notifications = new FakeNotificationService();
    const result = await createOrder(buildPayload(), repo, emailProvider, { notificationService: notifications });
    expect(result.clean.id).toBeTruthy();
    const all = await repo.list(10);
    expect(all.length).toBe(1);
    expect(emailProvider.sentEmails).toHaveLength(1);
    expect(emailProvider.sentEmails[0]).toMatchObject({
      to: "test@example.com",
      subject: "Order Confirmation",
    });
    expect(emailProvider.sentEmails[0].body).toContain(result.stored.id);
    expect(notifications.calls[0]).toMatchObject({
      recipient: expect.any(String),
      context: expect.objectContaining({ orderCode: result.clean.orderCode }),
    });
  });

  it("blocks duplicate recent cash orders by phone", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    const notifications = new FakeNotificationService();
    await createOrder(buildPayload(), repo, emailProvider, { notificationService: notifications });
    await expect(createOrder(buildPayload(), repo, emailProvider, { notificationService: notifications })).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("rejects orders missing customer contact", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await expect(
      createOrder(buildPayload({ customer: { name: "", phone: "" } }), repo, emailProvider, {
        notificationService: new FakeNotificationService(),
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects when items are missing even after fallback", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await expect(
      createOrder({ customer: { name: "A", phone: "1" } }, repo, emailProvider, {
        notificationService: new FakeNotificationService(),
      })
    ).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  it("retries fallback items mapping when sanitized items are filtered out", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    const payload = {
      customer: { name: "Fallback User", phone: "123" },
      items: [{ id: "", title: "Invalid", quantity: 0, unitPrice: "" }],
    };
    await expect(
      createOrder(payload as any, repo, emailProvider, { notificationService: new FakeNotificationService() })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("hydrates items from orderItems fallback and normalizes totals", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    const payload = {
      paymentMethod: "cash_on_delivery",
      customer: { name: "Fallback User", phone: "123" },
      totals: { items: 0, subtotal: null, subTotal: null, shipping: 10, currency: "EGP" },
      orderItems: [{ id: "x", title: "X", quantity: 2, price: 25, unitPrice: "25 EGP" }],
    };
    const result = await createOrder(payload, repo, emailProvider, { notificationService: new FakeNotificationService() });
    expect(result.clean.items).toHaveLength(1);
    expect(result.clean.items[0].qty).toBe(2);
    expect(result.clean.totals.subtotal).toBe(50);
    expect(result.clean.totals.shipping).toBe(10);
    expect(result.clean.createdAt).toBeInstanceOf(Date);
  });

  it("continues even when email providers or admin config fail", async () => {
    const repo = new InMemoryOrdersRepository();
    const throwingProvider = { send: jest.fn().mockRejectedValue(new Error("send failure")) } as any;
    const configProvider = new StaticConfigProvider();
    const result = await createOrder(buildPayload(), repo, throwingProvider, {
      notificationService: new FakeNotificationService(),
      configProvider,
    });
    expect(result.clean.id).toBeTruthy();
  });
});

describe("sanitizeOrderPayload", () => {
  it("parses string bodies and extracts currency", () => {
    const raw = JSON.stringify({
      paymentMethod: "card",
      totals: { currency: "usd" },
      customer: { name: "Currency User", phone: "123" },
      items: [{ id: "a", title: "A", quantity: 1, unitPrice: "$15.50" }],
    });
    const sanitized = sanitizeOrderPayload(raw);
    expect(sanitized.paymentMethod).toBe("card");
    expect(sanitized.totals.currency).toBe("USD");
    expect(sanitized.items[0].unitPriceValue).toBe(15.5);
  });

  it("handles invalid JSON bodies and object ids gracefully", () => {
    const id = new ObjectId();
    const sanitized = sanitizeOrderPayload("{not-json}");
    expect(sanitized.items).toEqual([]);

    const withOid = sanitizeOrderPayload({
      customer: { name: "OID User", phone: "123" },
      items: [{ id: "x", title: "X", quantity: 1, unitPrice: "10" }],
      customerId: { $oid: id.toString() },
    });
    expect(withOid.customerId).toBeInstanceOf(ObjectId);
  });
});

describe("notifications", () => {
  const sampleOrder = { orderCode: "TEST", customer: { name: "T", phone: "1" }, total: 10, createdAt: new Date().toISOString() };

  const buildTelegramDeps = (
    extraValues: Record<string, string> = {},
    flagOverrides?: Record<string, boolean>
  ) => {
    const configProvider = new StaticConfigProvider({
      values: {
        TELEGRAM_BOT_TOKEN: "dummy",
        TELEGRAM_CHAT_ID: "123",
        FEATURE_TELEGRAM_NOTIFICATIONS: "true",
        ...extraValues,
      },
    });
    const flagProvider = new SimpleFeatureFlagProvider(configProvider, {
      defaults: { TELEGRAM_NOTIFICATIONS: true },
      overrides: flagOverrides,
    });
    return { configProvider, flagProvider };
  };

  afterEach(() => {
    global.fetch = fakeFetch as any;
  });

  it("skips notifyTelegram when feature flag disables it", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps({ FEATURE_TELEGRAM_NOTIFICATIONS: "false" });
    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result.ok).toBe(false);
    expect(result.error?.message).toContain("disabled");
  });

  it("returns missing env metadata when telegram credentials are absent", async () => {
    const configProvider = new StaticConfigProvider({ values: { FEATURE_TELEGRAM_NOTIFICATIONS: "true" } });
    const flagProvider = new SimpleFeatureFlagProvider(configProvider, {
      defaults: { TELEGRAM_NOTIFICATIONS: true },
    });
    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result).toMatchObject({ ok: false, missingEnv: true });
  });

  it("uses https fallback when fetch is unavailable", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps();
    const originalFetch = global.fetch;
    // remove fetch to trigger https fallback path
    // @ts-expect-error
    global.fetch = undefined;

    const requestMock = jest
      .spyOn(https, "request")
      .mockImplementation((_options: any, callback: any) => {
        const res: any = new EventEmitter();
        res.statusCode = 200;
        res.statusMessage = "OK";
        process.nextTick(() => {
          callback(res);
          res.emit("data", Buffer.from("{}"));
          res.emit("end");
        });
        return {
          on: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        } as any;
      });

    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result.ok).toBe(true);
    expect(requestMock).toHaveBeenCalled();
    global.fetch = originalFetch;
    requestMock.mockRestore();
  });

  it("surfaces non-ok telegram responses", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps();
    const failingFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Bad",
      text: async () => "failed",
    });
    global.fetch = failingFetch as any;
    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(500);
  });

  it("returns ok false when notifyTelegram throws", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps();
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as any;
    const result = await notifyTelegram(sampleOrder as any, undefined, undefined, configProvider, flagProvider);
    expect(result.ok).toBe(false);
    expect((result as any).error).toBeDefined();
  });

  it("throws a 400 when running notifyTelegramTest without credentials", async () => {
    const configProvider = new StaticConfigProvider({ values: { FEATURE_TELEGRAM_NOTIFICATIONS: "true" } });
    const flagProvider = new SimpleFeatureFlagProvider(configProvider, {
      defaults: { TELEGRAM_NOTIFICATIONS: true },
    });
    await expect(
      notifyTelegramTest({ configProvider, featureFlagProvider: flagProvider })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("succeeds in notifyTelegramTest with credentials present", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps();
    const result = await notifyTelegramTest({ configProvider, featureFlagProvider: flagProvider });
    expect(result).toEqual({ ok: true });
  });

  it("bubbles a failure when notifyTelegram returns not ok inside notifyTelegramTest", async () => {
    const { configProvider, flagProvider } = buildTelegramDeps();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Unavailable",
      text: async () => "",
    }) as any;
    await expect(
      notifyTelegramTest({ configProvider, featureFlagProvider: flagProvider })
    ).rejects.toMatchObject({ statusCode: 500 });
  });
});
