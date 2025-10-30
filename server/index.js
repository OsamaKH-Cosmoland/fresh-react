/* eslint-env node */

import "dotenv/config";
import http from "http";
import { URL } from "url";

import ordersHandler, { notifyTelegramTest, streamOrders } from "../api/orders.js";
import reviewsHandler from "../api/reviews.js";
import fruitsHandler from "../api/fruits.js";

// ✅ Railway sets PORT for you; also keep API_PORT fallback for local
const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

const respondNotFound = (res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
};

// ✅ CORS helper
function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or set your domain instead of *
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

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
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

const server = http.createServer(async (req, res) => {
  setCors(res);                         // ✅ add CORS on every response
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

  if (parsedUrl.pathname === "/api/notify-test") {
    await notifyTelegramTest(req, res);
    return;
  }

  const pathname = parsedUrl.pathname;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.json = (payload) => {
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json");
    }
    res.end(JSON.stringify(payload));
  };

  if (pathname === "/api/orders/stream") {
    streamOrders(req, res);
    return;
  }

  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }

  if (pathname === "/api/notify-test") {
    await notifyTelegramTest(req, res);
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
