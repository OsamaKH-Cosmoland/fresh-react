import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { createFruit, deleteFruit, listFruits, updateFruit } from "../server/services/fruits";
import { createOrder, listOrders, notifyTelegramTest, ordersStream, updateOrderStatus } from "../server/services/orders";
import { createReview, listReviews } from "../server/services/reviews";
import type { EmailProvider } from "./providers";

type Request = IncomingMessage & { method?: string; body?: any; query?: Record<string, string>; url?: string };
type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

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

export async function normalizeServerlessRequest(req: IncomingMessage) {
  const base = `http://${req.headers.host ?? "localhost"}`;
  const parsedUrl = new URL(req.url ?? "/", base);
  (req as any).query = Object.fromEntries(parsedUrl.searchParams.entries());
  if (req.method && req.method !== "GET") {
    (req as any).body = await parseRequestBody(req);
  } else {
    (req as any).body = {};
  }
  return req;
}

export function enhanceApiResponse(res: ServerResponse) {
  if (!(res as any).status) {
    (res as any).status = (code: number) => {
      res.statusCode = code;
      return res;
    };
  }
  if (!(res as any).json) {
    (res as any).json = (payload: unknown) => {
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json");
      }
      res.end(JSON.stringify(payload));
      return res;
    };
  }
}

export function streamOrdersHandler(_req: Request, res: Response) {
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
}

export function buildOrdersHandler({ emailProvider }: { emailProvider: EmailProvider }) {
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
}

export async function notifyTestHandler(_req: Request, res: Response) {
  try {
    const result = await notifyTelegramTest();
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(error?.statusCode ?? 500).json({ ok: false, error: error?.message ?? "Server error" });
  }
}

export async function reviewsHandler(req: Request, res: Response) {
  try {
    if (req.method === "GET") {
      const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
      const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 200)) : 50;
      const docs = await listReviews(limit);
      return res.status(200).json(docs);
    }

    if (req.method === "POST") {
      const saved = await createReview(typeof req.body === "string" ? JSON.parse(req.body) : req.body);
      return res.status(201).json(saved);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error: any) {
    console.error("API /api/reviews error:", error);
    const statusCode = error?.statusCode ?? 500;
    return res.status(statusCode).json({ error: error?.message ?? "Server error" });
  }
}

export async function fruitsHandler(req: Request, res: Response) {
  try {
    if (req.method === "GET") {
      const clean = await listFruits();
      return res.status(200).json(clean);
    }

    if (req.method === "POST") {
      const created = await createFruit(req.body);
      return res.status(201).json(created);
    }

    if (req.method === "DELETE") {
      const id = req.query?.id;
      const result = await deleteFruit(id);
      return id ? res.status(204).end() : res.status(200).json(result);
    }

    if (req.method === "PUT") {
      const id = req.query?.id;
      const updated = await updateFruit(id || "", req.body);
      return res.status(200).json(updated);
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE", "PUT"]);
    return res.status(405).end("Method Not Allowed");
  } catch (err: any) {
    console.error("API /api/fruits error:", err);
    const statusCode = err?.statusCode ?? 500;
    return res.status(statusCode).json({ error: err?.message ?? "Server error" });
  }
}

export async function healthHandler(_req: IncomingMessage, res: Response) {
  res.status(200).json({ ok: true, time: new Date().toISOString() });
}

export async function orderCreatedWebhookHandler(req: Request, res: Response) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const payload = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const required = ["orderId", "orderNumber", "email", "items", "total", "currency"];
    const missing = required.filter((k) => (payload as any)[k] == null);
    if (missing.length) {
      return res.status(400).json({ ok: false, error: `Missing fields: ${missing.join(", ")}` });
    }

    payload.etaDate =
      payload.etaDate ||
      new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    payload.createdAt = payload.createdAt || new Date().toISOString();

    const webhook = process.env.N8N_ORDERS_WEBHOOK ?? process.env.VITE_N8N_ORDERS_WEBHOOK;
    if (!webhook) {
      return res.status(500).json({ ok: false, error: "Missing N8N_ORDERS_WEBHOOK" });
    }

    const r = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.N8N_API_KEY ?? "",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      return res.status(502).json({ ok: false, error: `n8n error: ${r.status} ${text}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || "Server error" });
  }
}
