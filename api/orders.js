/* eslint-env node */

import "dotenv/config";
import { EventEmitter } from "events";
import { MongoClient } from "mongodb";
import nodemailer from "nodemailer";

let cachedClient = null;
let cachedDb = null;
let cachedTransporter = null;
const bus = new EventEmitter();
bus.setMaxListeners(0);

const sanitizeString = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

async function connectToDb() {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or MONGODB_DB env vars");
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

function sanitizePayload(rawBody) {
  let body = rawBody;
  if (typeof rawBody === "string" && rawBody.trim().length) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};
  const items = Array.isArray(body.items)
    ? body.items.map((item) => ({
        id: sanitizeString(item?.id),
        title: sanitizeString(item?.title) || "Custom item",
        quantity: Number(item?.quantity ?? 0),
        unitPrice: sanitizeString(item?.unitPrice ?? ""),
      }))
    : [];

  const totalsItems = Number(
    body?.totals?.items ?? items.reduce((sum, item) => sum + (item?.quantity ?? 0), 0)
  );
  const subtotal = Number(body?.totals?.subtotal ?? 0);

  return {
    id: sanitizeString(body.id) || `NG-${Date.now().toString(36).toUpperCase()}`,
    paymentMethod: sanitizeString(body.paymentMethod) || "cash_on_delivery",
    status: sanitizeString(body.status) || "pending",
    totals: {
      items: Number.isFinite(totalsItems) ? totalsItems : 0,
      subtotal: Number.isFinite(subtotal) ? subtotal : 0,
    },
    customer: {
      name: sanitizeString(body?.customer?.name),
      email: sanitizeString(body?.customer?.email),
      phone: sanitizeString(body?.customer?.phone),
      address: sanitizeString(body?.customer?.address),
      city: sanitizeString(body?.customer?.city),
      notes: sanitizeString(body?.customer?.notes),
    },
    items: items.filter((item) => item.id && item.quantity > 0),
  };
}

const cleanOrderDoc = ({ _id, ...rest }) => ({ ...rest, mongoId: _id?.toString() });

const generateOrderCode = () => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NG-${randomPart}`;
};

const ensureMailer = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error("Missing SMTP configuration env vars");
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
};

const sendAdminEmail = async (order) => {
  const adminEmail = sanitizeString(process.env.ADMIN_EMAIL);
  const fromEmail = sanitizeString(process.env.FROM_EMAIL || process.env.SMTP_USER);
  if (!adminEmail || !fromEmail) {
    throw new Error("Missing ADMIN_EMAIL or FROM_EMAIL env vars");
  }

  const transporter = await ensureMailer();
  const { customer, totals, orderCode, id } = order;
  const subject = `New cash order ${orderCode}`;
  const textLines = [
    `Order ID: ${id}`,
    `Order Code: ${orderCode}`,
    `Name: ${customer.name}`,
    `Email: ${customer.email}`,
    `Phone: ${customer.phone}`,
    `City: ${customer.city}`,
    `Address: ${customer.address}`,
    `Notes: ${customer.notes || "-"}`,
    `Items: ${order.items.length}`,
    `Subtotal: ${totals.subtotal}`,
    `Received At: ${order.createdAt}`,
  ];

  await transporter.sendMail({
    to: adminEmail,
    from: fromEmail,
    subject,
    text: textLines.join("\n"),
  });
};

export const notifyTelegram = async (order) => {
  try {
    console.log(
      `[telegram] notifying for order ${order?.orderCode ?? order?.id ?? "unknown"}`
    );
    const token = sanitizeString(process.env.TELEGRAM_BOT_TOKEN);
    const chatId = sanitizeString(process.env.TELEGRAM_CHAT_ID);
    if (!token || !chatId) {
      console.warn(
        "[telegram] env missing: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID"
      );
      return { ok: false, missingEnv: true };
    }
    if (typeof fetch !== "function") {
      console.warn("[telegram] global fetch unavailable in this runtime");
      return { ok: false, fetchMissing: true };
    }
    const fmt = (value) =>
      value === null || value === undefined || value === ""
        ? "-"
        : String(value);

    const text =
      `🧾 *New Order* \`${fmt(order.orderCode)}\`\n` +
      `👤 *Name:* ${fmt(order.customer?.name)}\n` +
      `📧 *Email:* ${fmt(order.customer?.email)}\n` +
      `📞 *Phone:* ${fmt(order.customer?.phone)}\n` +
      `🏙️ *City:* ${fmt(order.customer?.city)}\n` +
      `💰 *Total:* ${fmt(order.total ?? order?.totals?.subtotal)}\n` +
      `🕒 *Time:* ${new Date(order.createdAt ?? Date.now()).toLocaleString()}`;

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const textBody = await res.text().catch(() => "");
      console.error(
        "Telegram notify failed:",
        res.status,
        textBody || res.statusText
      );
      return { ok: false, status: res.status, body: textBody };
    }
    return { ok: true };
  } catch (error) {
    console.error("Telegram notify error:", error);
    return { ok: false, error };
  }
};

export const streamOrders = (req, res) => {
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

  const handleNewOrder = (order) => {
    if (res.writableEnded) return;
    res.write(`event: new-order\n`);
    res.write(`data: ${JSON.stringify(order)}\n\n`);
  };

  bus.on("new-order", handleNewOrder);

  const close = () => {
    clearInterval(heartbeat);
    bus.off("new-order", handleNewOrder);
  };

  req.on("close", close);
  req.on("error", close);
};

export default async function handler(req, res) {
  try {
    console.log(`[orders] ${req.method} ${req.url}`);
    if (req.method !== "GET") {
      console.log("[orders] request body:", req.body);
    }

    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,POST,PATCH,OPTIONS");
      return res.status(204).end();
    }

    const { db } = await connectToDb();
    const col = db.collection("orders");

    if (req.method === "GET") {
      const limitParam = Number.parseInt(req.query?.limit ?? "50", 10);
      const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(limitParam, 500)) : 50;
      const docs = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
      return res.status(200).json(docs.map(cleanOrderDoc));
    }

    if (req.method === "POST") {
      const payload = sanitizePayload(req.body);
      if (!payload.customer.name || !payload.customer.phone) {
        return res.status(400).json({ error: "Missing customer contact information." });
      }
      if (payload.items.length === 0) {
        return res.status(400).json({ error: "Missing order items." });
      }

      const now = new Date();
      const cutoff = new Date(now.getTime() - 2 * 60 * 1000).toISOString();

      if (payload.paymentMethod === "cash_on_delivery" && payload.customer.phone) {
        const duplicate = await col.findOne({
          "customer.phone": payload.customer.phone,
          paymentMethod: "cash_on_delivery",
          createdAt: { $gte: cutoff },
        });
        if (duplicate) {
          return res
            .status(409)
            .json({ error: "A recent order was already placed from this phone number. Please wait a moment." });
        }
      }

      const orderCode = generateOrderCode();
      const doc = {
        ...payload,
        orderCode,
        createdAt: payload.createdAt ?? now.toISOString(),
        updatedAt: payload.updatedAt ?? now.toISOString(),
      };
      const insertResult = await col.insertOne(doc);
      doc._id = doc._id ?? insertResult.insertedId;

      try {
        await sendAdminEmail(doc);
      } catch (emailError) {
        console.error("Failed to send admin email for order", doc.id, emailError);
      }

      const cleanDoc = cleanOrderDoc(doc);
      bus.emit("new-order", cleanDoc);

      try {
        await notifyTelegram({ ...cleanDoc, total: cleanDoc?.totals?.subtotal });
      } catch (telegramError) {
        console.error("Failed to notify Telegram for order", doc.id, telegramError);
      }

      return res.status(201).json({ ok: true, orderId: doc.id, orderCode: doc.orderCode });
    }

    if (req.method === "PATCH") {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: "Missing order id" });
      }
      const status = req.body?.status;
      if (!status) {
        return res.status(400).json({ error: "Missing status" });
      }
      const result = await col.findOneAndUpdate(
        { id },
        { $set: { status, updatedAt: new Date().toISOString() } },
        { returnDocument: "after" }
      );
      if (!result.value) {
        return res.status(404).json({ error: "Order not found" });
      }
      return res.status(200).json(cleanOrderDoc(result.value));
    }

    res.setHeader("Allow", ["GET", "POST", "PATCH"]);
    return res.status(405).end("Method Not Allowed");
  } catch (error) {
    console.error("API /api/orders error:", error);
    return res.status(500).json({ error: "Server error" });
  }
}

export const notifyTelegramTest = async (req, res) => {
  const token = sanitizeString(process.env.TELEGRAM_BOT_TOKEN);
  const chatId = sanitizeString(process.env.TELEGRAM_CHAT_ID);
  if (!token || !chatId) {
    console.warn("[telegram] env missing for test endpoint");
    return res
      .status(400)
      .json({ error: "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars." });
  }
  const sampleOrder = {
    orderCode: "TEST-123ABC",
    customer: {
      name: "Sample Customer",
      email: "sample@example.com",
      phone: "+201234567890",
      city: "Cairo",
    },
    total: 199.99,
    createdAt: new Date().toISOString(),
  };

  const result = await notifyTelegram(sampleOrder);
  if (result?.ok) {
    return res.status(200).json({ ok: true });
  }
  return res.status(500).json({
    ok: false,
    error: "Failed to send Telegram message. Check server logs for details.",
  });
};
