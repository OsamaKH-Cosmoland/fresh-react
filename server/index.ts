import "dotenv/config";
import http, { type IncomingMessage, type ServerResponse } from "http";
import { URL } from "url";

import {
  buildOrdersHandler,
  notifyTestHandler,
  streamOrdersHandler,
} from "../lib/http/ordersHandler";
import reviewsHandler from "../lib/http/reviewsHandler";
import fruitsHandler from "../lib/http/fruitsHandler";
import orderCreatedWebhookHandler from "../lib/http/orderCreatedWebhookHandler";
import healthHandler from "../lib/http/healthHandler";
import { GmailEmailProvider } from "../providers/gmailEmailProvider";
import { FakeEmailProvider } from "../providers/fakeEmailProvider";
import type { EmailProvider } from "../providers/emailProvider";

type Request = IncomingMessage & {
  url?: string;
  method?: string;
  body?: any;
  query?: Record<string, string>;
};

type Response = ServerResponse & {
  status: (code: number) => Response;
  json: (payload: unknown) => void;
};

// ✅ Railway sets PORT for you; also keep API_PORT fallback for local
const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

let emailProvider: EmailProvider;
try {
  emailProvider = new GmailEmailProvider();
} catch (error) {
  console.warn("[email] GmailEmailProvider unavailable:", error);
  emailProvider = new FakeEmailProvider();
}
const ordersHandler = buildOrdersHandler({ emailProvider });

const respondNotFound = (res: Response) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
};

// ✅ CORS helper
function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or set your domain instead of *
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const parseRequestBody = async (req: IncomingMessage) => {
  const chunks: Buffer[] = [];
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });
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

const server = http.createServer(async (rawReq, rawRes) => {
  const req = rawReq as Request;
  const res = rawRes as Response;
  setCors(res);                         // ✅ add CORS on every response
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(payload));
  };

  if (req.method === "OPTIONS") {       // ✅ handle preflight
    res.statusCode = 204;
    return res.end();
  }

  if (!req.url) {
    respondNotFound(res);
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  const pathname = parsedUrl.pathname;

  if (pathname === "/api/orders/stream") {
    streamOrdersHandler(req as any, res as any);
    return;
  }

  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }

  if (pathname === "/api/notify-test") {
    await notifyTestHandler(req as any, res as any);
    return;
  }

  if (pathname === "/api/order-created") {
    await orderCreatedWebhookHandler(req as any, res as any);
    return;
  }

  if (pathname === "/api/health") {
    await healthHandler(req as any, res as any);
    return;
  }

  if (pathname.startsWith("/api/orders")) {
    await ordersHandler(req, res);
    return;
  }

  if (pathname.startsWith("/api/reviews")) {
    await reviewsHandler(req, res);
    return;
  }

  if (pathname.startsWith("/api/fruits")) {
    await fruitsHandler(req, res);
    return;
  }

  respondNotFound(res);
});

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
