import { InMemoryOrdersRepository } from "../../infrastructure/repositories/InMemoryOrdersRepository";
import { createOrder, notifyTelegram, sanitizeOrderPayload } from "./orders";
import { FakeEmailProvider } from "../../infrastructure/email/fakeEmailProvider";
import nodemailer from "nodemailer";
import https from "https";
import { EventEmitter } from "events";
import fs from "fs";
import { ObjectId } from "mongodb";

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
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "pass";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.FROM_EMAIL = "from@test.com";
    process.env.TELEGRAM_BOT_TOKEN = "dummy";
    process.env.TELEGRAM_CHAT_ID = "123";
    global.fetch = fakeFetch as any;
    jest.spyOn(nodemailer, "createTransport").mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({}),
    } as any);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("creates an order with the repository", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    const result = await createOrder(buildPayload(), repo, emailProvider);
    expect(result.clean.id).toBeTruthy();
    const all = await repo.list(10);
    expect(all.length).toBe(1);
    expect(emailProvider.sentEmails).toHaveLength(1);
    expect(emailProvider.sentEmails[0]).toMatchObject({
      to: "test@example.com",
      subject: "Order Confirmation",
    });
    expect(emailProvider.sentEmails[0].body).toContain(result.stored.id);
  });

  it("blocks duplicate recent cash orders by phone", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await createOrder(buildPayload(), repo, emailProvider);
    await expect(createOrder(buildPayload(), repo, emailProvider)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("rejects orders missing customer contact", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await expect(
      createOrder(buildPayload({ customer: { name: "", phone: "" } }), repo, emailProvider)
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects when items are missing even after fallback", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await expect(createOrder({ customer: { name: "A", phone: "1" } }, repo, emailProvider)).rejects.toMatchObject({
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
    await expect(createOrder(payload as any, repo, emailProvider)).rejects.toMatchObject({ statusCode: 400 });
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
    const result = await createOrder(payload, repo, emailProvider);
    expect(result.clean.items).toHaveLength(1);
    expect(result.clean.items[0].qty).toBe(2);
    expect(result.clean.totals.subtotal).toBe(50);
    expect(result.clean.totals.shipping).toBe(10);
    expect(result.clean.createdAt).toBeInstanceOf(Date);
  });

  it("continues even when email providers or admin config fail", async () => {
    const repo = new InMemoryOrdersRepository();
    const originalAdmin = process.env.ADMIN_EMAIL;
    const originalFrom = process.env.FROM_EMAIL;
    process.env.ADMIN_EMAIL = "";
    process.env.FROM_EMAIL = "";
    const throwingProvider = { send: jest.fn().mockRejectedValue(new Error("send failure")) } as any;
    const result = await createOrder(buildPayload(), repo, throwingProvider);
    expect(result.clean.id).toBeTruthy();
    process.env.ADMIN_EMAIL = originalAdmin;
    process.env.FROM_EMAIL = originalFrom;
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
  const originalTelegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const originalTelegramChat = process.env.TELEGRAM_CHAT_ID;
  const sampleOrder = { orderCode: "TEST", customer: { name: "T", phone: "1" }, total: 10, createdAt: new Date().toISOString() };

  afterEach(() => {
    process.env.TELEGRAM_BOT_TOKEN = originalTelegramToken;
    process.env.TELEGRAM_CHAT_ID = originalTelegramChat;
    global.fetch = fakeFetch as any;
  });

  it("returns missing env metadata when telegram credentials are absent", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "";
    process.env.TELEGRAM_CHAT_ID = "";
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.resetModules();
    const { notifyTelegram: freshNotify } = await import("./ordersService");
    const result = await freshNotify(sampleOrder as any);
    existsSpy.mockRestore();
    expect(result).toMatchObject({ ok: false, missingEnv: true });
  });

  it("uses https fallback when fetch is unavailable", async () => {
    const originalFetch = global.fetch;
    // remove fetch to trigger https fallback path
    // @ts-expect-error
    global.fetch = undefined;

    const requestMock = jest.spyOn(https, "request").mockImplementation((_options: any, callback: any) => {
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

    const result = await notifyTelegram(sampleOrder as any);
    expect(result.ok).toBe(true);
    expect(requestMock).toHaveBeenCalled();
    global.fetch = originalFetch;
    requestMock.mockRestore();
  });

  it("surfaces non-ok telegram responses", async () => {
    const failingFetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Bad",
      text: async () => "failed",
    });
    global.fetch = failingFetch as any;
    const result = await notifyTelegram(sampleOrder as any);
    expect(result.ok).toBe(false);
    expect((result as any).status).toBe(500);
  });

  it("returns ok false when notifyTelegram throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as any;
    const result = await notifyTelegram(sampleOrder as any);
    expect(result.ok).toBe(false);
    expect((result as any).error).toBeDefined();
  });

  it("throws a 400 when running notifyTelegramTest without credentials", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "";
    process.env.TELEGRAM_CHAT_ID = "";
    const existsSpy = jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.resetModules();
    const { notifyTelegramTest: freshTest } = await import("./ordersService");
    await expect(freshTest()).rejects.toMatchObject({ statusCode: 400 });
    existsSpy.mockRestore();
  });

  it("succeeds in notifyTelegramTest with credentials present", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "dummy";
    process.env.TELEGRAM_CHAT_ID = "123";
    jest.resetModules();
    const { notifyTelegramTest: freshTest } = await import("./ordersService");
    const result = await freshTest();
    expect(result).toEqual({ ok: true });
  });

  it("bubbles a failure when notifyTelegram returns not ok inside notifyTelegramTest", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "dummy";
    process.env.TELEGRAM_CHAT_ID = "123";
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Unavailable",
      text: async () => "",
    }) as any;
    jest.resetModules();
    const { notifyTelegramTest: freshTest } = await import("./ordersService");
    await expect(freshTest()).rejects.toMatchObject({ statusCode: 500 });
  });
});
