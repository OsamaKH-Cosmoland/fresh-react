import "dotenv/config";
import http, { type IncomingMessage } from "http";
import { URL } from "url";

import {
  buildOrdersHandler,
  notifyTestHandler,
  streamOrdersHandler,
} from "./handlers/ordersHandler";
import reviewsHandler from "./handlers/reviewsHandler";
import productsHandler from "./handlers/productsHandler";
import { createOrderCreatedWebhookHandler } from "./handlers/orderCreatedWebhookHandler";
import healthHandler from "./handlers/healthHandler";
import { loginHandler } from "./handlers/loginHandler";
import { getUsersHandler } from "./handlers/getUsersHandler";
import { GmailEmailProvider } from "../../infrastructure/email/gmailEmailProvider";
import { FakeEmailProvider } from "../../infrastructure/email/fakeEmailProvider";
import type { EmailProvider } from "../../domain/shared/EmailProvider";
import { getLogger } from "@/logging/globalLogger";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";
import { SimpleFeatureFlagProvider } from "@/infrastructure/config/SimpleFeatureFlagProvider";
import type { Request, Response } from "./handlers/typeHandler";

const configProvider = new EnvConfigProvider();
const featureFlagProvider = new SimpleFeatureFlagProvider(configProvider, {
  defaults: { TELEGRAM_NOTIFICATIONS: true },
});

// ✅ Railway sets PORT for you; also keep API_PORT fallback for local
const PORT =
  configProvider.getNumber("PORT") ??
  configProvider.getNumber("API_PORT") ??
  3000;

let emailProvider: EmailProvider;
try {
  emailProvider = new GmailEmailProvider();
} catch (error) {
  getLogger().warn("[email] GmailEmailProvider unavailable", { error });
  emailProvider = new FakeEmailProvider();
}
const ordersHandler = buildOrdersHandler({
  emailProvider,
  configProvider,
  featureFlagProvider,
});

const orderCreatedHandler = createOrderCreatedWebhookHandler(configProvider);

const respondNotFound = (res: Response) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
};

const sendServerError = (res: Response, error: unknown) => {
  const statusCode = (error as any)?.statusCode ?? 500;
  const message = (error as any)?.message ?? "Internal Server Error";
  if (!res.writableEnded) {
    res.status(statusCode).json({ error: message });
  }
};

// ✅ CORS helper
function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or set your domain instead of *
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

const MAX_BODY_SIZE = 1_048_576;

const parseRequestBody = async (req: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];
  let totalLength = 0;
  await new Promise<void>((resolve, reject) => {
    req.on("data", (chunk) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      totalLength += buffer.length;
      if (totalLength > MAX_BODY_SIZE) {
        reject(Object.assign(new Error("Payload too large"), { statusCode: 413 }));
        return;
      }
      chunks.push(buffer);
    });
    req.on("end", resolve);
    req.on("error", reject);
  });
  const raw = chunks.length ? Buffer.concat(chunks).toString() : "";
  if (!raw) return {};
  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(raw);
    } catch {
      throw Object.assign(new Error("Invalid JSON payload"), { statusCode: 400 });
    }
  }
  return raw;
};

const server = http.createServer(async (rawReq, rawRes): Promise<void> => {
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

  try {
    if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (!req.url) {
    respondNotFound(res);
    return;
  }

    const host = req.headers.host;
    if (!host) {
      respondNotFound(res);
      return;
    }

    const parsedUrl = new URL(req.url, `http://${host}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());

  const pathname = parsedUrl.pathname;

  if (pathname === "/api/orders/stream") {
      await streamOrdersHandler(req, res);
    return;
  }

  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }

  if (pathname === "/api/notify-test") {
      await notifyTestHandler(req, res);
    return;
  }

  if (pathname === "/api/order-created") {
      await orderCreatedHandler(req, res);
    return;
  }

  if (pathname === "/api/health") {
      await healthHandler(req, res);
    return;
  }

  if (pathname === "/api/login") {
      await loginHandler(req, res);
    return;
  }

  if (pathname === "/api/users") {
      await getUsersHandler(req, res);
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

  if (pathname.startsWith("/api/products")) {
    await productsHandler(req, res);
    return;
  }

  respondNotFound(res);
  return;
  } catch (error) {
    getLogger().error("[api] request failure", { error });
    sendServerError(res, error);
  }
});

server.listen(PORT, () => {
  getLogger().info("[api] listening", { port: PORT });
});
