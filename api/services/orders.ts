// Order domain services: validation, creation, duplicate detection, notifications.
import "dotenv/config";
import { EventEmitter } from "events";
import https from "https";
import fs from "fs";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { resolveOrdersRepository } from "../repositories";
import type { OrdersRepository } from "../repositories/OrdersRepository";
import type { Order } from "../domain/Order";

let cachedTransporter: nodemailer.Transporter | null = null;
const bus = new EventEmitter();
bus.setMaxListeners(0);

const sanitizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const postJson = async (url: string, payload: unknown) => {
  if (typeof fetch === "function") {
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  const target = new URL(url);
  const bodyString = JSON.stringify(payload);

  return new Promise<{ ok: boolean; status: number; statusText: string; text: () => Promise<string> }>((resolve, reject) => {
    const request = https.request(
      {
        hostname: target.hostname,
        port: target.port || 443,
        path: `${target.pathname}${target.search}`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(bodyString),
        },
      },
      (response) => {
        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            ok: !!(response.statusCode && response.statusCode >= 200 && response.statusCode < 300),
            status: response.statusCode ?? 0,
            statusText: response.statusMessage ?? "",
            text: async () => text,
          });
        });
      }
    );

    request.on("error", reject);
    request.write(bodyString);
    request.end();
  });
};

let cachedTelegramConfig: { token: string; chatId: string } | null = null;
const resolveFromCandidates = (...values: string[]) => {
  for (const value of values) {
    const cleaned = sanitizeString(value);
    if (cleaned) return cleaned;
  }
  return "";
};

const parseAmount = (value: unknown): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string" && value.trim().length) {
    const numeric = Number.parseFloat(value.replace(/[^\d.-]/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
  }
  return null;
};

const roundCurrency = (value: number) =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

const extractCurrencyFromPrice = (price: string | number) => {
  const text = sanitizeString(price);
  if (!text) return "";
  const matches = text.match(/[A-Za-z]{3,}/g);
  return matches?.pop()?.toUpperCase() ?? "";
};

const resolveCustomerId = (...candidates: unknown[]) => {
  for (const candidate of candidates) {
    const cleaned = sanitizeString(candidate).replace(/\s+/g, "");
    if (cleaned) return cleaned;
  }
  return "";
};

const ensureObjectId = (value: unknown, fallbackSeed = "") => {
  if (value instanceof ObjectId) return value;
  if (value && typeof value === "object" && typeof (value as any).$oid === "string") {
    const oid = (value as any).$oid.trim();
    if (ObjectId.isValid(oid)) return new ObjectId(oid);
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) {
      if (ObjectId.isValid(trimmed)) return new ObjectId(trimmed);
      const hash = crypto.createHash("sha1").update(trimmed).digest("hex").slice(0, 24);
      const padded = hash.padEnd(24, "0");
      return new ObjectId(padded);
    }
  }
  if (fallbackSeed && typeof fallbackSeed === "string" && fallbackSeed.trim()) {
    const hash = crypto.createHash("sha1").update(fallbackSeed.trim()).digest("hex").slice(0, 24);
    return new ObjectId(hash.padEnd(24, "0"));
  }
  return new ObjectId();
};

const loadTelegramConfigFile = () => {
  try {
    const configPath = new URL("../config/telegram.config.json", import.meta.url);
    const resolvedPath = fileURLToPath(configPath);
    if (!fs.existsSync(resolvedPath)) return {};
    const raw = fs.readFileSync(resolvedPath, "utf8");
    if (!raw.trim()) return {};
    const parsed = JSON.parse(raw);
    return {
      token: sanitizeString(parsed.botToken ?? parsed.token ?? parsed.telegramBotToken),
      chatId: sanitizeString(parsed.chatId ?? parsed.telegramChatId ?? parsed.telegram_chat_id),
    };
  } catch (error) {
    console.warn("[telegram] failed to read telegram.config.json", error);
    return {};
  }
};

const getTelegramConfig = () => {
  if (cachedTelegramConfig) return cachedTelegramConfig;
  const envToken = resolveFromCandidates(
    process.env.TELEGRAM_BOT_TOKEN || "",
    process.env.VITE_TELEGRAM_BOT_TOKEN || "",
    process.env.REACT_APP_TELEGRAM_BOT_TOKEN || "",
    process.env.NG_TELEGRAM_BOT_TOKEN || ""
  );
  const envChat = resolveFromCandidates(
    process.env.TELEGRAM_CHAT_ID || "",
    process.env.VITE_TELEGRAM_CHAT_ID || "",
    process.env.REACT_APP_TELEGRAM_CHAT_ID || "",
    process.env.NG_TELEGRAM_CHAT_ID || ""
  );
  if (envToken && envChat) {
    cachedTelegramConfig = { token: envToken, chatId: envChat };
    return cachedTelegramConfig;
  }
  const fileConfig = loadTelegramConfigFile();
  cachedTelegramConfig = {
    token: envToken || (fileConfig as any).token || "",
    chatId: envChat || (fileConfig as any).chatId || "",
  };
  return cachedTelegramConfig;
};

export function sanitizeOrderPayload(rawBody: any): Order {
  let body: any = rawBody;
  if (typeof rawBody === "string" && rawBody.trim().length) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const sanitizedItems = rawItems.map((item: any) => {
    const rawVariant = item?.variant ?? item?.selectedVariant ?? item;
    const variantSize =
      sanitizeString(rawVariant?.size ?? rawVariant?.name ?? rawVariant?.label ?? rawVariant) ||
      "standard";
    const variantPriceSource =
      parseAmount(
        typeof rawVariant?.price === "object" && rawVariant?.price !== null
          ? rawVariant?.price?.amount ?? rawVariant?.price?.value
          : rawVariant?.price
      ) ?? parseAmount(item?.price) ?? parseAmount(item?.unitPrice);
    const sanitizedUnitPrice = sanitizeString(item?.unitPrice ?? "");

    return {
      id: sanitizeString(item?.id),
      title: sanitizeString(item?.title) || "Custom item",
      quantity: Number(item?.quantity ?? 0),
      unitPrice: sanitizedUnitPrice,
      variant: {
        name: variantSize.toLowerCase(),
        label: variantSize,
        size: variantSize,
        price: Number.isFinite(variantPriceSource) ? roundCurrency(variantPriceSource!) : null,
      },
    };
  });

  const filteredItems = sanitizedItems.filter((item: any) => item.id && item.quantity > 0);
  const enrichedItems = filteredItems.map((item: any) => {
    const qty = Number.isFinite(item.quantity) ? item.quantity : 0;
    const unitPriceValue = parseAmount(item.unitPrice) ?? 0;
    const lineTotal = roundCurrency(unitPriceValue * qty);
    const variantSize =
      sanitizeString(item.variant?.size ?? item.variant?.label ?? item.variant?.name) || "standard";
    const variantCurrency = sanitizeString(
      item.variant?.currency || body?.totals?.currency || extractCurrencyFromPrice(item.unitPrice)
    );
    const variantPriceRaw =
      typeof item.variant?.price === "object" && item.variant?.price !== null
        ? parseAmount(item.variant?.price?.amount ?? item.variant?.price?.value)
        : parseAmount(item.variant?.price);
    const variantPrice = Number.isFinite(variantPriceRaw) ? roundCurrency(variantPriceRaw!) : unitPriceValue;
    const variant =
      item.variant && typeof item.variant === "object" && !Array.isArray(item.variant)
        ? {
            ...item.variant,
            name: sanitizeString(item.variant.name ?? item.variant.label) || variantSize.toLowerCase(),
            label: sanitizeString(item.variant.label ?? item.variant.name) || variantSize,
            size: variantSize,
            currency: variantCurrency || "EGP",
            price: variantPrice,
          }
        : {
            name: variantSize.toLowerCase(),
            label: variantSize,
            size: variantSize,
            currency: variantCurrency || "EGP",
            price: variantPrice,
          };
    return {
      ...item,
      productSlug: item.id,
      variant,
      qty,
      lineTotal,
      unitPriceValue,
    };
  });

  const totalsItemsProvided = Number.parseInt(body?.totals?.items, 10);
  const itemsQuantity = enrichedItems.reduce((sum: number, item: any) => sum + (item?.qty ?? 0), 0);
  const totalsItems =
    Number.isFinite(totalsItemsProvided) && totalsItemsProvided >= 0
      ? totalsItemsProvided
      : itemsQuantity;

  const subtotalProvided = parseAmount(body?.totals?.subtotal);
  const subTotalProvided = parseAmount(body?.totals?.subTotal);
  const shippingProvided = parseAmount(body?.totals?.shipping);
  const grandTotalProvided = parseAmount(body?.totals?.grandTotal);

  const subtotalFromItems = roundCurrency(
    enrichedItems.reduce((sum: number, item: any) => sum + (item?.lineTotal ?? 0), 0)
  );
  const subtotal = subtotalProvided ?? subtotalFromItems;
  const subTotal = subTotalProvided ?? subtotal;
  const shipping = shippingProvided ?? 0;
  const grandTotal = grandTotalProvided ?? roundCurrency(subTotal + shipping);

  const currencyCandidate =
    sanitizeString(body?.totals?.currency) ||
    extractCurrencyFromPrice(enrichedItems.find((item: any) => item.unitPrice)?.unitPrice ?? "") ||
    "EGP";
  const currency = currencyCandidate ? currencyCandidate.toUpperCase() : "EGP";

  const customer = {
    name: sanitizeString(body?.customer?.name),
    email: sanitizeString(body?.customer?.email),
    phone: sanitizeString(body?.customer?.phone),
    address: sanitizeString(body?.customer?.address),
    city: sanitizeString(body?.customer?.city),
    notes: sanitizeString(body?.customer?.notes),
  };

  const id = sanitizeString(body.id) || `NG-${Date.now().toString(36).toUpperCase()}`;
  const customerIdentifier = resolveCustomerId(
    body?.customerId,
    body?.customer?.customerId,
    customer.phone,
    customer.email
  );
  const customerFingerprint =
    customerIdentifier || customer.phone || customer.email || `cust-${id}`;
  const customerId = ensureObjectId(customerIdentifier, customerFingerprint);

  return {
    id,
    customerId,
    paymentMethod: sanitizeString(body.paymentMethod) || "cash_on_delivery",
    status: sanitizeString(body.status) || "pending",
    totals: {
      items: Number.isFinite(totalsItems) ? totalsItems : 0,
      subtotal: Number.isFinite(subtotal) ? subtotal : subtotalFromItems,
      subTotal: Number.isFinite(subTotal) ? subTotal : subtotalFromItems,
      shipping: Number.isFinite(shipping) ? shipping : 0,
      grandTotal: Number.isFinite(grandTotal)
        ? grandTotal
        : roundCurrency((Number.isFinite(subTotal) ? subTotal : subtotalFromItems) + (Number.isFinite(shipping) ? shipping : 0)),
      currency,
    },
    customer,
    items: enrichedItems,
  };
}

const cleanOrderDoc = ({ _id, customerId, ...rest }: any) => ({
  ...rest,
  customerId: customerId instanceof ObjectId ? customerId.toString() : customerId,
  mongoId: _id?.toString(),
});

const generateOrderCode = () => {
  const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NG-${randomPart}`;
};

const toValidDate = (value: any, fallback: Date) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
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

const sendAdminEmail = async (order: Order) => {
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

export const notifyTelegram = async (order: Partial<Order>) => {
  try {
    console.log(`[telegram] notifying for order ${order?.orderCode ?? order?.id ?? "unknown"}`);
    const { token, chatId } = getTelegramConfig();
    if (!token || !chatId) {
      console.warn("[telegram] credentials missing: TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID");
      return { ok: false, missingEnv: true };
    }
    if (typeof fetch !== "function") {
      console.warn("[telegram] global fetch unavailable; using https fallback");
    }
    const fmt = (value: unknown) =>
      value === null || value === undefined || value === "" ? "-" : String(value);

    const textLines = [
      `🧾 New Order ${fmt(order.orderCode)}`,
      `👤 Name: ${fmt(order.customer?.name)}`,
      `📧 Email: ${fmt(order.customer?.email)}`,
      `📞 Phone: ${fmt(order.customer?.phone)}`,
      `🏙️ City: ${fmt(order.customer?.city)}`,
      `💰 Total: ${fmt((order as any).total ?? order?.totals?.subtotal)}`,
      `🕒 Time: ${new Date(order?.createdAt ?? Date.now()).toLocaleString()}`,
    ];
    const text = textLines.join("\n");

    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const body = {
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    };

    const res = await postJson(url, body);
    if (!res.ok) {
      const textBody = await res.text().catch(() => "");
      console.error("Telegram notify failed:", res.status, textBody || res.statusText);
      return { ok: false, status: res.status, body: textBody };
    }
    return { ok: true };
  } catch (error) {
    console.error("Telegram notify error:", error);
    return { ok: false, error };
  }
};

export const ordersStream = () => bus;

export async function listOrders(limit: number, repo?: OrdersRepository) {
  const store = repo ?? (await resolveOrdersRepository()).store;
  const docs = await store.list(limit);
  return docs.map(cleanOrderDoc);
}

export async function createOrder(rawBody: any, repo?: OrdersRepository) {
  const store = repo ?? (await resolveOrdersRepository()).store;
  const payload = sanitizeOrderPayload(rawBody);
  if (!payload.customer.name || !payload.customer.phone) {
    throw new Error("Missing customer contact information.");
  }
  if (payload.items.length === 0) {
    throw new Error("Missing order items.");
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - 2 * 60 * 1000);

  if (payload.paymentMethod === "cash_on_delivery" && payload.customer.phone) {
    const duplicate = await store.findRecentCashOrderByPhone(payload.customer.phone, cutoff);
    if (duplicate) {
      const error: any = new Error(
        "A recent order was already placed from this phone number. Please wait a moment."
      );
      error.statusCode = 409;
      throw error;
    }
  }

  const createdAt = toValidDate((payload as any).createdAt, now);
  const updatedAt = toValidDate((payload as any).updatedAt, now);
  const orderCode = generateOrderCode();
  const doc: Order = {
    ...payload,
    orderCode,
    createdAt,
    updatedAt,
  };
  const storedDoc = await store.create(doc);

  try {
    await sendAdminEmail(storedDoc);
  } catch (emailError) {
    console.error("Failed to send admin email for order", storedDoc.id, emailError);
  }

  const cleanDoc = cleanOrderDoc(storedDoc);
  bus.emit("new-order", cleanDoc);

  try {
    await notifyTelegram({ ...cleanDoc, total: cleanDoc?.totals?.subtotal });
  } catch (telegramError) {
    console.error("Failed to notify Telegram for order", storedDoc.id, telegramError);
  }

  return { stored: storedDoc, clean: cleanDoc };
}

export async function updateOrderStatus(id: string, status: string, repo?: OrdersRepository) {
  const store = repo ?? (await resolveOrdersRepository()).store;
  const updated = await store.updateStatus(id, status);
  return updated ? cleanOrderDoc(updated) : null;
}

export async function notifyTelegramTest() {
  const { token, chatId } = getTelegramConfig();
  if (!token || !chatId) {
    const error: any = new Error("Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID env vars.");
    error.statusCode = 400;
    throw error;
  }
  const sampleOrder = {
    orderCode: "TEST-123ABC",
    customer: {
      name: "Sample Customer",
      email: "sample@example.com",
      phone: "+201234567890",
      city: "Cairo",
      address: "Test Street",
      notes: "",
    },
    total: 199.99,
    createdAt: new Date().toISOString(),
  };

  const result = await notifyTelegram(sampleOrder);
  if (!result?.ok) {
    const err: any = new Error("Failed to send Telegram message. Check server logs for details.");
    err.statusCode = 500;
    throw err;
  }
  return { ok: true };
}
