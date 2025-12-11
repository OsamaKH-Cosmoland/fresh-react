// HTTP adapter for the n8n order-created webhook.
import type { IncomingMessage, ServerResponse } from "http";

type Request = IncomingMessage & { body?: any; method?: string };
type Response = ServerResponse & { status: (code: number) => Response; json: (payload: unknown) => void };

export default async function orderCreatedWebhookHandler(req: Request, res: Response) {
  const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*"; // set to your site origin in production

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
