import { URL } from "url";
import type { IncomingMessage, ServerResponse } from "http";
import nodemailer from "nodemailer";
import { createOrder, listOrders, notifyTelegramTest, ordersStream, updateOrderStatus } from "../shared/services/ordersService";

type ServerlessRequest = IncomingMessage & { body?: any; query?: Record<string, string>; url?: string; method?: string };
type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

type Request = ServerlessRequest;
type Response = ServerlessResponse;

type EmailProvider = { send(to: string, subject: string, body: string): Promise<void> };

const stripHtml = (value: string): string => {
  const plain = value.replace(/<\/?[^>]+(>|$)/g, " ");
  return plain.replace(/\s+/g, " ").trim();
};

const pickEnv = (...candidates: Array<string | undefined>) => {
  for (const candidate of candidates) {
    const cleaned = candidate?.trim();
    if (cleaned) return cleaned;
  }
  return "";
};

const parseBoolean = (value?: string) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return null;
};

class FakeEmailProvider implements EmailProvider {
  sentEmails: { to: string; subject: string; body: string }[] = [];
  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }
}

class GmailEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = pickEnv(process.env.SMTP_HOST, process.env.EMAIL_HOST);
    const portValue = pickEnv(process.env.SMTP_PORT, process.env.EMAIL_PORT);
    const port = portValue ? Number(portValue) : 465;
    const user = pickEnv(process.env.SMTP_USER, process.env.EMAIL_USER);
    const pass = pickEnv(process.env.SMTP_PASS, process.env.EMAIL_PASS);

    if (!host || !user || !pass || Number.isNaN(port)) {
      throw new Error("Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    }

    const explicitSecure = parseBoolean(process.env.SMTP_SECURE ?? process.env.EMAIL_SECURE);
    const secure = explicitSecure ?? port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const userAddress = pickEnv(
      process.env.SMTP_USER,
      process.env.EMAIL_USER,
      process.env.FROM_EMAIL,
      process.env.EMAIL_FROM_ADDRESS
    );
    const displayName = pickEnv(process.env.EMAIL_FROM_NAME, "NaturaGloss");
    const replyTo = pickEnv(process.env.EMAIL_FROM_ADDRESS, process.env.FROM_EMAIL);
    const fromAddress = userAddress || "no-reply@natureskincare.local";
    const from = `${displayName} <${fromAddress}>`;
    const textFallback = stripHtml(body) || "Thank you for your NaturaGloss order.";

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text: textFallback,
      html: body,
      replyTo: replyTo || undefined,
    });
  }
}

const parseRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  }).catch(() => {});
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

async function normalizeServerlessRequest(req: ServerlessRequest) {
  const base = `http://${req.headers.host ?? "localhost"}`;
  const parsedUrl = new URL(req.url ?? "/", base);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }
  return req;
}

function enhanceApiResponse(res: ServerlessResponse) {
  if (!res.status) {
    (res as any).status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!res.json) {
    (res as any).json = (payload: unknown) => {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}

const streamOrdersHandler = (_req: Request, res: Response) => {
  const bus = ordersStream();
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.flushHeaders?.();
  res.write(`event: connected\ndata: {}\n\n`);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(`: heartbeat ${Date.now()}\n\n`);
  }, 25000);

  const handleNewOrder = (order: unknown) => {
    if (res.writableEnded) return;
    res.write(`event: new-order\n`);
    res.write(`data: ${JSON.stringify(order)}\n\n`);
  };

  bus.on("new-order", handleNewOrder);

  const close = () => {
    clearInterval(heartbeat);
    bus.off("new-order", handleNewOrder);
  };

  _req.on("close", close);
  _req.on("error", close);
};

const buildOrdersHandler = ({ emailProvider }: { emailProvider: EmailProvider }) => {
  return async function ordersHandler(req: Request, res: Response) {
    try {
      if (req.method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,PATCH,OPTIONS");
        return res.status(204).end();
      }

      if (req.method === "GET") {
        const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 50;
        const docs = await listOrders(limit);
        return res.status(200).json(docs);
      }

      if (req.method === "POST") {
        const result = await createOrder(req.body, undefined, emailProvider);
        return res
          .status(201)
          .json({ ok: true, orderId: result.stored.id, orderCode: result.stored.orderCode });
      }

      if (req.method === "PATCH") {
        const id = req.query?.id || (req.body as any)?.id;
        if (!id) {
          return res.status(400).json({ error: "Missing order id" });
        }
        const status = (req.body as any)?.status;
        if (!status) {
          return res.status(400).json({ error: "Missing status" });
        }
        const updated = await updateOrderStatus(id, status);
        if (!updated) {
          return res.status(404).json({ error: "Order not found" });
        }
        return res.status(200).json(updated);
      }

      res.setHeader("Allow", ["GET", "POST", "PATCH"]);
      return res.status(405).end("Method Not Allowed");
    } catch (error: any) {
      const statusCode = error?.statusCode ?? 500;
      const message = error?.message ?? "Server error";
      console.error("API /api/orders error:", error);
      return res.status(statusCode).json({ error: message });
    }
  };
};

const notifyTestHandler = async (_req: Request, res: Response) => {
  try {
    const result = await notifyTelegramTest();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({ ok: false, error: error?.message ?? "Server error" });
  }
};

const createEmailProvider = (): EmailProvider => {
  try {
    return new GmailEmailProvider();
  } catch (error) {
    console.warn("[email] GmailEmailProvider unavailable:", error);
    return new FakeEmailProvider();
  }
};

const emailProvider = createEmailProvider();
const ordersHandler = buildOrdersHandler({ emailProvider });

export default async function handler(rawReq: ServerlessRequest, rawRes: ServerlessResponse) {
  console.log("orders handler version 2 loaded");
  const req = await normalizeServerlessRequest(rawReq);
  const res = rawRes;
  enhanceApiResponse(res);

  try {
    const pathname = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`).pathname;

    if (pathname === "/api/orders/stream") {
      return streamOrdersHandler(req, res);
    }

    if (pathname === "/api/notify-test") {
      return notifyTestHandler(req, res);
    }

    if (req.method === "POST") {
      const payload = req.body ?? {};
      const customer = typeof payload?.customer === "object" ? payload.customer : {};
      const hasCustomerName = typeof customer?.name === "string" && customer.name.trim().length > 0;
      const hasCustomerPhone = typeof customer?.phone === "string" && customer.phone.trim().length > 0;
      const items = Array.isArray(payload?.items) ? payload.items : [];

      if (!hasCustomerName || !hasCustomerPhone) {
        return res.status(400).json({ error: "Customer name and phone are required" });
      }

      if (!items.length) {
        return res.status(400).json({ error: "Order must include at least one item" });
      }
    }

    return await ordersHandler(req, res);
  } catch (error: any) {
    console.error("orders handler error", error);
    const message = typeof error?.message === "string" ? error.message : "Unexpected server error";
    if (res.headersSent) {
      return res.end();
    }
    return res.status(500).json({ error: "Internal server error", details: message });
  }
}
