import type { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";

type ServerlessRequest = IncomingMessage & { body?: any; method?: string; headers: IncomingMessage["headers"]; url?: string };
type ServerlessResponse = ServerResponse & {
  status: (code: number) => ServerlessResponse;
  json: (payload: unknown) => ServerlessResponse;
};

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
  req.body = await parseRequestBody(req);
  req.headers = req.headers;
  req.url = parsedUrl.pathname + parsedUrl.search;
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

export default async function handler(rawReq: ServerlessRequest, res: ServerlessResponse) {
  await normalizeServerlessRequest(rawReq);
  enhanceApiResponse(res);

  if (rawReq.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (rawReq.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    const payload = typeof rawReq.body === "string" ? JSON.parse(rawReq.body || "{}") : rawReq.body || {};

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
