/* eslint-env node */

import "dotenv/config";
import http from "http";
import { URL } from "url";

import ordersHandler, { notifyTelegramTest, streamOrders } from "../api/orders.js";

const PORT = Number(process.env.API_PORT ?? 3000);

const respondNotFound = (res) => {
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
};

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

  if (!parsedUrl.pathname.startsWith("/api/orders")) {
    respondNotFound(res);
    return;
  }

  if (parsedUrl.pathname === "/api/orders/stream") {
    streamOrders(req, res);
    return;
  }

  if (req.method && req.method !== "GET") {
    req.body = await parseRequestBody(req);
  } else {
    req.body = {};
  }

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

  try {
    await ordersHandler(req, res);
  } catch (error) {
    console.error("Server error handling /api/orders:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Server error" }));
  }
});

server.listen(PORT, () => {
  console.log(`[api] listening on http://localhost:${PORT}`);
});
