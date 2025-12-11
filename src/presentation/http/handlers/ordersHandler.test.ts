import { InMemoryOrdersRepository } from "@/infrastructure/repositories/InMemoryOrdersRepository";
import { FakeEmailProvider } from "@/infrastructure/email/fakeEmailProvider";
import { EventEmitter } from "events";

let currentRepo: InMemoryOrdersRepository;
let handler: any;
let streamHandler: any;

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({}),
  })),
}));

type MockReq = {
  method?: string;
  body?: any;
  query?: Record<string, string>;
};

type MockRes = {
  _status?: number;
  _json?: any;
  _ended?: any;
  headers: Record<string, unknown>;
  status: (code: number) => MockRes;
  json: (payload: unknown) => MockRes;
  end: (payload?: unknown) => MockRes;
  setHeader: (key: string, value: unknown) => void;
};

const createReqRes = (method: string, body?: any, query?: Record<string, string>) => {
  const res: MockRes = {
    headers: {},
    status(code: number) {
      this._status = code;
      return this;
    },
    json(payload: unknown) {
      this._json = payload;
      return this;
    },
    end(payload?: unknown) {
      this._ended = payload;
      return this;
    },
    setHeader(key: string, value: unknown) {
      this.headers[key] = value;
    },
  };
  const req: MockReq = { method, body, query };
  return { req, res };
};

describe("ordersHandler", () => {
  let repo: InMemoryOrdersRepository;
  const emailProvider = new FakeEmailProvider();

  beforeAll(() => {
    process.env.SMTP_HOST = "smtp.test";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USER = "user@test.com";
    process.env.SMTP_PASS = "pass";
    process.env.ADMIN_EMAIL = "admin@test.com";
    process.env.FROM_EMAIL = "from@test.com";
    process.env.TELEGRAM_BOT_TOKEN = "dummy";
    process.env.TELEGRAM_CHAT_ID = "123";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: "OK",
      text: async () => "",
    }) as any;
  });

  beforeAll(async () => {
    const unstableMockModule =
      (jest as typeof jest & {
        unstable_mockModule?: (moduleName: string, factory: () => unknown) => Promise<void>;
      }).unstable_mockModule;
    if (!unstableMockModule) {
      throw new Error("jest.unstable_mockModule is unavailable");
    }

    await unstableMockModule("@/infrastructure/repositories", () => ({
      resolveOrdersRepository: jest.fn(async () => ({ type: "mock", store: currentRepo })),
      resetOrdersRepositoryCache: jest.fn(),
    }));
    const module = await import("./ordersHandler");
    handler = module.buildOrdersHandler({ emailProvider }) as any;
    streamHandler = module.streamOrdersHandler;
  });

  beforeEach(() => {
    repo = new InMemoryOrdersRepository();
    currentRepo = repo;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("streams orders via SSE", async () => {
    jest.useFakeTimers();
    const writes: string[] = [];
    const res: any = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn((chunk: string) => writes.push(chunk)),
      writableEnded: false,
    };
    const req: any = new EventEmitter();

    streamHandler(req, res);
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
    expect(writes.some((w) => w.includes("event: connected"))).toBe(true);

    const { ordersStream } = await import("@/application/usecases/ordersService");
    ordersStream().emit("new-order", { id: "123" });
    expect(writes.some((w) => w.includes("new-order"))).toBe(true);

    req.emit("close");
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("returns 204 for OPTIONS requests", async () => {
    const { req, res } = createReqRes("OPTIONS");
    await handler(req, res);
    expect(res.headers["Allow"]).toBe("GET,POST,PATCH,OPTIONS");
    expect(res._status).toBe(204);
  });

  it("creates an order via POST and returns order identifiers", async () => {
    const payload = {
      paymentMethod: "cash_on_delivery",
      customer: { name: "Tester", phone: "123" },
      totals: { items: 1, subtotal: 50, subTotal: 50, shipping: 0, currency: "EGP" },
      items: [{ id: "p1", title: "Product 1", quantity: 1, unitPrice: "50", variant: { price: 50 } }],
    };
    const { req, res } = createReqRes("POST", payload);
    await handler(req, res);
    expect(res._status).toBe(201);
    expect(res._json?.orderId).toBeTruthy();
    expect(res._json?.orderCode).toMatch(/NG-/);
    expect((await repo.list(5))[0].id).toBe(res._json.orderId);
  });

  it("returns 400 for invalid body", async () => {
    const { req, res } = createReqRes("POST", { items: [] });
    await handler(req, res);
    expect(res._status).toBe(400);
    expect(res._json?.error).toBeDefined();
  });

  it("lists orders via GET with limit parsing", async () => {
    await repo.create({
      id: "one",
      orderCode: "NG-ONE",
      paymentMethod: "cash_on_delivery",
      status: "pending",
      totals: { items: 1, subtotal: 10, subTotal: 10, shipping: 0, grandTotal: 10, currency: "EGP" },
      customer: { name: "X", email: "", phone: "1", address: "", city: "", notes: "" },
      items: [],
      customerId: "c1" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const { req, res } = createReqRes("GET", undefined, { limit: "1" });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(Array.isArray(res._json)).toBe(true);
    expect(res._json.length).toBe(1);
  });

  it("updates status via PATCH and handles missing params", async () => {
    const created = await repo.create({
      id: "two",
      orderCode: "NG-TWO",
      paymentMethod: "cash_on_delivery",
      status: "pending",
      totals: { items: 1, subtotal: 10, subTotal: 10, shipping: 0, grandTotal: 10, currency: "EGP" },
      customer: { name: "Y", email: "", phone: "2", address: "", city: "", notes: "" },
      items: [],
      customerId: "c2" as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const missingId = createReqRes("PATCH", { status: "shipped" });
    await handler(missingId.req, missingId.res);
    expect(missingId.res._status).toBe(400);

    const missingStatus = createReqRes("PATCH", { id: created.id });
    await handler(missingStatus.req, missingStatus.res);
    expect(missingStatus.res._status).toBe(400);

    const { req, res } = createReqRes("PATCH", { id: created.id, status: "shipped" });
    await handler(req, res);
    expect(res._status).toBe(200);
    expect(res._json.status).toBe("shipped");
  });

  it("rejects unsupported methods with 405", async () => {
    const { req, res } = createReqRes("DELETE");
    await handler(req as any, res as any);
    expect(res._status).toBe(405);
  });
});
