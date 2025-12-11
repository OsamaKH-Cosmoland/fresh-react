import "dotenv/config";
import { EventEmitter } from "events";
import crypto from "crypto";
import { ObjectId } from "mongodb";
import { resolveOrdersRepository } from "../../infrastructure/repositories";
import type { OrdersRepository } from "../../infrastructure/repositories/OrdersRepository";
import type { Order } from "../../domain/shared/Order";
import type { EmailProvider } from "../../domain/shared/EmailProvider";
import type { NotificationService } from "../../domain/shared/NotificationService";
import type { Clock } from "../../domain/shared/Clock";
import type { IdGenerator } from "../../domain/shared/IdGenerator";
import { SystemClock } from "../../infrastructure/time/SystemClock";
import { DefaultIdGenerator } from "../../infrastructure/ids/DefaultIdGenerator";
import { getDefaultNotificationService } from "../../infrastructure/notifications/createDefaultNotificationService";
import { TelegramNotificationService } from "../../infrastructure/notifications/TelegramNotificationService";

const bus = new EventEmitter();
bus.setMaxListeners(0);
const defaultClock: Clock = new SystemClock();
const defaultIdGenerator: IdGenerator = new DefaultIdGenerator("NG");

const sanitizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
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

export function sanitizeOrderPayload(rawBody: any, idGenerator: IdGenerator = defaultIdGenerator): Order {
  let body: any = rawBody;
  if (typeof rawBody === "string" && rawBody.trim().length) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};

  const sourceItems =
    Array.isArray(body.items) && body.items.length > 0
      ? body.items
      : Array.isArray(body.orderItems) && body.orderItems.length > 0
      ? body.orderItems
      : [];
  const rawItems = sourceItems;
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
      quantity: Number(item?.quantity ?? 1),
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

  const id = sanitizeString(body.id) || idGenerator.nextId();
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

const generateOrderCode = (idGenerator: IdGenerator) => idGenerator.nextId();

const toValidDate = (value: any, fallback: Date) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date;
};

const formatOrderNotificationMessage = (order: Partial<Order>, clock: Clock) => {
  const fmt = (value: unknown) => (value === null || value === undefined || value === "" ? "-" : String(value));
  const createdAtCandidate = order?.createdAt ? new Date(order.createdAt) : clock.now();
  const createdAt =
    Number.isNaN(createdAtCandidate.getTime()) || !createdAtCandidate.getTime()
      ? clock.now()
      : createdAtCandidate;

  const textLines = [
    `🧾 New Order ${fmt(order.orderCode)}`,
    `👤 Name: ${fmt(order.customer?.name)}`,
    `📧 Email: ${fmt(order.customer?.email)}`,
    `📞 Phone: ${fmt(order.customer?.phone)}`,
    `🏙️ City: ${fmt(order.customer?.city)}`,
    `💰 Total: ${fmt((order as any).total ?? order?.totals?.subtotal)}`,
    `🕒 Time: ${createdAt.toLocaleString()}`,
  ];
  return textLines.join("\n");
};

const resolveOpsRecipients = () => ({
  email: sanitizeString(process.env.ADMIN_EMAIL),
  telegram: sanitizeString(process.env.TELEGRAM_CHAT_ID),
});

const createTelegramNotificationService = () => new TelegramNotificationService();

export const notifyTelegram = async (
  order: Partial<Order>,
  clock: Clock = defaultClock,
  notificationService: NotificationService = createTelegramNotificationService()
) => {
  const message = formatOrderNotificationMessage(order, clock);
  try {
    await notificationService.notify("", message, {
      category: "order",
      orderId: sanitizeString((order as any).id),
      orderCode: sanitizeString((order as any).orderCode),
      recipients: { telegram: process.env.TELEGRAM_CHAT_ID || "" },
    });
    return { ok: true };
  } catch (error: any) {
    console.error("Telegram notify error:", error);
    return {
      ok: false,
      error,
      status: error?.status,
      missingEnv: error?.code === "MISSING_TELEGRAM_CONFIG",
    };
  }
};

export const ordersStream = () => bus;

const formatAmount = (value: number | null | undefined) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(2);
  }
  return "0.00";
};

const sanitizeCurrencyLabel = (currency?: string) => sanitizeString(currency) || "EGP";

const buildOrderConfirmationHtml = (order: Order) => {
  const orderId = sanitizeString(order.id);
  const orderNumber = sanitizeString(order.orderCode ?? orderId);
  const customerName = sanitizeString(order.customer?.name) || "valued guest";
  const currencyLabel = sanitizeCurrencyLabel(order.totals?.currency);
  const totalValue = order.totals?.grandTotal ?? order.totals?.subtotal ?? 0;
  const totalDisplay = `${formatAmount(totalValue)} ${currencyLabel}`;
  const deliveryDate =
    sanitizeString((order as any).etaDate) || "We’ll share shipping updates as soon as your package ships.";

  const itemRows = order.items
    .map((item: any) => {
      const title = sanitizeString(item.title);
      const variantLabel = sanitizeString(item.variant?.size ?? item.variant?.label ?? "");
      const quantity = Number.isFinite(item.quantity) ? item.quantity : Number(item.qty ?? 0) || 0;
      const unitPriceCandidate =
        typeof item.variant?.price === "number"
          ? item.variant.price
          : typeof item.unitPriceValue === "number"
          ? item.unitPriceValue
          : Number(
              String(item.unitPrice ?? "")
                .replace(/[^0-9.-]/g, "")
                .trim()
            );
      const unitPrice = Number.isFinite(unitPriceCandidate) ? unitPriceCandidate : null;
      const lineTotal =
        unitPrice !== null && Number.isFinite(quantity) ? unitPrice * quantity : null;
      const formattedUnitPrice =
        unitPrice !== null ? `${unitPrice.toFixed(2)} ${currencyLabel}` : sanitizeString(item.unitPrice) || "-";
      const formattedLineTotal =
        lineTotal !== null ? `${lineTotal.toFixed(2)} ${currencyLabel}` : "";

      return `
        <tr>
          <td style="padding:12px 0; border-bottom:1px solid #e5e5e5; vertical-align:top;">
            <p style="margin:0; font-weight:600; color:#1a3a2c;">${title}</p>
            ${variantLabel ? `<p style="margin:4px 0 0; color:#5c5c5c; font-size:13px;">Size: ${variantLabel}</p>` : ""}
          </td>
          <td style="padding:12px 0; border-bottom:1px solid #e5e5e5; text-align:right; vertical-align:top;">
            <p style="margin:0; font-weight:600; color:#1a3a2c;">${quantity}</p>
            <p style="margin:4px 0 0; color:#5c5c5c; font-size:13px;">Qty</p>
          </td>
          <td style="padding:12px 0; border-bottom:1px solid #e5e5e5; text-align:right; vertical-align:top;">
            <p style="margin:0; font-weight:600; color:#c9a94a;">${formattedUnitPrice}</p>
            ${formattedLineTotal ? `<p style="margin:4px 0 0; color:#5c5c5c; font-size:13px;">${formattedLineTotal}</p>` : ""}
          </td>
        </tr>`;
    })
    .join("");

  const itemsSection = order.items.length
    ? `<table style="width:100%; border-collapse:collapse; margin-top:10px;">
         <thead>
           <tr>
             <th style="text-align:left; padding-bottom:8px; font-size:14px; color:#0f5132;">Item</th>
             <th style="text-align:right; padding-bottom:8px; font-size:14px; color:#0f5132;">Qty</th>
             <th style="text-align:right; padding-bottom:8px; font-size:14px; color:#0f5132;">Price</th>
           </tr>
         </thead>
         <tbody>
           ${itemRows}
         </tbody>
       </table>`
    : "";

  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#fafafa; padding:25px; color:#2a2a2a;">
      <div style="max-width:600px; margin:auto; background:white; border-radius:12px; padding:30px; border:1px solid #e5e5e5;">
        <div style="text-align:center; margin-bottom:25px;">
          <h2 style="color:#0f5132; margin:0; font-size:26px; font-weight:700;">
            🌿 Thank You for Your Order!
          </h2>
          <p style="color:#777; margin-top:8px; font-size:14px;">
            Your wellness journey with NaturaGloss has officially begun ✨
          </p>
        </div>

        <div style="background:#f0f7f3; padding:20px; border-radius:10px; border-left:5px solid #c9a94a; margin-bottom:25px;">
          <h3 style="margin:0; color:#0f5132; font-size:20px;">Order Details</h3>
          <p style="margin:12px 0 0; font-size:15px;">
            <strong>Order #:</strong> ${orderNumber}<br>
            <strong>Order ID:</strong> ${orderId}<br>
            <strong>Customer:</strong> ${customerName}<br>
            <strong>Total:</strong> <span style="color:#c9a94a; font-weight:bold;">${totalDisplay}</span>
          </p>
        </div>

        ${itemsSection}

        <p style="font-size:15px; line-height:1.7;">
          Hi <strong>${customerName}</strong>,<br><br>
          We’re excited to let you know that your order has been received and is now being prepared with care 💚
          You will receive another update once your package is on its way!
        </p>

        <div style="margin-top:20px; padding:18px; background:#fff8e5; border:1px solid #f1e0b8; border-radius:10px;">
          <h3 style="margin:0; color:#c9a94a; font-size:18px;">
            📦 Estimated Delivery
          </h3>
          <p style="margin:10px 0 0; font-size:15px;">
            ${deliveryDate}
          </p>
        </div>

        <div style="text-align:center; margin-top:35px;">
          <p style="font-size:14px; color:#777;">
            Thank you for choosing <strong style="color:#0f5132;">NaturaGloss</strong> —
            where beauty meets nature 🌿✨
          </p>
          <p style="font-size:13px; color:#aaa; margin-top:10px;">
            If you need help, reply directly to this email.
          </p>
        </div>
      </div>
    </div>`;
};

export async function listOrders(limit: number, repo?: OrdersRepository) {
  const store = repo ?? (await resolveOrdersRepository()).store;
  const docs = await store.list(limit);
  return docs.map(cleanOrderDoc);
}

export type OrderServiceDependencies = {
  clock?: Clock;
  idGenerator?: IdGenerator;
  notificationService?: NotificationService;
};

export async function createOrder(
  rawBody: any,
  repo?: OrdersRepository,
  emailProvider?: EmailProvider,
  deps: OrderServiceDependencies = {}
) {
  const clock = deps.clock ?? defaultClock;
  const idGenerator = deps.idGenerator ?? defaultIdGenerator;
  const notificationService = deps.notificationService ?? getDefaultNotificationService();
  const store = repo ?? (await resolveOrdersRepository()).store;
  const payload = sanitizeOrderPayload(rawBody, idGenerator);
  console.log(
    "createOrder payload debug:",
    JSON.stringify(
      {
        rawBodyType: typeof rawBody,
        rawBody,
        items: payload.items,
        itemsLength: payload.items?.length,
        customer: payload.customer,
      },
      null,
      2
    )
  );
  if (!payload.customer.name || !payload.customer.phone) {
    const error: any = new Error("Missing customer contact information.");
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    const body = typeof rawBody === "string" ? JSON.parse(rawBody || "{}") : rawBody || {};
    const fallbackItems = Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.orderItems)
      ? body.orderItems
      : [];

    if (fallbackItems.length > 0) {
      payload.items = fallbackItems
        .map((item: any) => ({
          id: String(item.id ?? item._id ?? ""),
          title: String(item.title ?? item.name ?? "Custom item"),
          quantity: Number(item.quantity ?? 1),
          unitPrice: String(item.unitPrice ?? item.price ?? ""),
          variant: {
            name: "standard",
            label: "Standard",
            size: "standard",
            price: Number(item.price ?? 0),
          },
        }))
        .filter((i: any) => i.id && i.quantity > 0);
    }
  }
  if (payload.items.length === 0) {
    const error: any = new Error("Missing order items.");
    error.statusCode = 400;
    throw error;
  }

  const now = clock.now();
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
  const orderCode = generateOrderCode(idGenerator);
  const doc: Order = {
    ...payload,
    orderCode,
    createdAt,
    updatedAt,
  };
  const storedDoc = await store.create(doc);

  if (emailProvider) {
    const customerName = sanitizeString(payload.customer?.name) || "customer";
    const candidate = sanitizeString(payload.customer?.email);
    const safeName = customerName.replace(/\s+/g, ".").toLowerCase();
    const recipient = candidate || `${safeName}@example.com`;
    try {
      const htmlBody = buildOrderConfirmationHtml(storedDoc);
      await emailProvider.send(recipient, "Order Confirmation", htmlBody);
    } catch (emailError) {
      console.error("Failed to send confirmation email for order", storedDoc.id, emailError);
    }
  }

  const cleanDoc = cleanOrderDoc(storedDoc);
  bus.emit("new-order", cleanDoc);

  try {
    const recipients = resolveOpsRecipients();
    const opsMessage = formatOrderNotificationMessage({ ...cleanDoc, total: cleanDoc?.totals?.subtotal }, clock);
    const primaryRecipient = recipients.email || recipients.telegram || "ops";
    await notificationService.notify(primaryRecipient, opsMessage, {
      category: "order",
      subject: `New cash order ${orderCode}`,
      orderId: sanitizeString((cleanDoc as any).id),
      orderCode,
      recipients,
    });
  } catch (notificationError) {
    console.error("Failed to notify ops for order", storedDoc.id, notificationError);
  }

  return { stored: storedDoc, clean: cleanDoc };
}

export async function updateOrderStatus(id: string, status: string, repo?: OrdersRepository) {
  const store = repo ?? (await resolveOrdersRepository()).store;
  const updated = await store.updateStatus(id, status);
  return updated ? cleanOrderDoc(updated) : null;
}

export async function notifyTelegramTest(
  notificationService: NotificationService = createTelegramNotificationService()
) {
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

  const result = await notifyTelegram(sampleOrder, defaultClock, notificationService);
  if (!result?.ok) {
    const message =
      (result as any)?.error?.message ?? "Failed to send Telegram message. Check server logs for details.";
    const err: any = new Error(message);
    err.statusCode = (result as any)?.missingEnv ? 400 : 500;
    throw err;
  }
  return { ok: true };
}
