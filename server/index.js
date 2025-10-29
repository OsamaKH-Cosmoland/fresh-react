/* eslint-env node */

import "dotenv/config";
import http from "http";
import { URL } from "url";

import ordersHandler, { notifyTelegramTest, streamOrders } from "../api/orders.js";
import reviewsHandler from "../api/reviews.js";
import fruitsHandler from "../api/fruits.js";

// 👇 Render sets PORT. Keep API_PORT as fallback for local use.
const PORT = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);

// --- CORS helpers (needed when frontend and API are on different origins) ---
const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://fruit-shop-osama.vercel.app",     // your live site
  // add any other domains that should be allowed to call your API
]);

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.has(origin) || process.env.CORS_ANY === "1")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Vary", "Origin"); // ensure caches vary by origin
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

// --- utils ---
const respond = (res, code, payload) => {
  res.statusCode = code;
  if (!res.getHeader("Content-Type")) res.setHeader("Content-Type", "application/json");
  res.end(typeof payload === "string" ? payload : JSON.stringify(payload));
};

const respondNotFound = (res) => respond(res, 404, { error: "Not Found" });

const parseRequestBody = async (req) => {
  const chunks = [];
  await new Promise((resolve, reject) => {
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", resolve);
    req.on("error", reject);
  });
  const raw = Buffer.concat(chunks).toString();
  if (!raw) return {};

  const contentType = req.headers["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
};

const server = http.createServer(async (req, res) => {
  // CORS for all requests
  setCorsHeaders(req, res);

  // Handle preflight early
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  if (!req.url) return respondNotFound(res);

  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  req.query = Object.fromEntries(parsedUrl.searchParams.entries());
  const pathname = parsedUrl.pathname;

  // helpers like res.status / res.json (optional sugar)
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => respond(res, res.statusCode || 200, payload);

  // Health check
  if (pathname === "/api/health") {
    return respond(res, 200, { ok: true, time: new Date().toISOString() });
  }

  // Test Telegram (keep once)
  if (pathname === "/api/notify-test") {
    return await notifyTelegramTest(req, res);
  }

  // SSE stream
  if (pathname === "/api/orders/stream") {
    return streamOrders(req, res);
  }

  // Body only for non-GET
  req.body = (req.method && req.method !== "GET") ? await parseRequestBody(req) : {};

  // Route to handlers
  if (pathname.startsWith("/api/orders"))  return await ordersHandler(req, res);
  if (pathname.startsWith("/api/reviews")) return await reviewsHandler(req, res);
  if (pathname.startsWith("/api/fruits"))  return await fruitsHandler(req, res);

  return respondNotFound(res);
});

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
