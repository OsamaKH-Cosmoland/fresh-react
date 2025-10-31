/* eslint-env node */

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { connectToDb } from "./_db.js";

const FALLBACK_LIMIT = 500;
const fallbackFileUrl = new URL("../config/orders-fallback.json", import.meta.url);
const fallbackFilePath = fileURLToPath(fallbackFileUrl);

const ensureDir = async (filepath) => {
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
};

const cloneOrder = (order) => JSON.parse(JSON.stringify(order));

class MongoOrdersStore {
  constructor(collection) {
    this.collection = collection;
  }

  async list(limit) {
    const docs = await this.collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs;
  }

  async findRecentCashOrderByPhone(phone, sinceIso) {
    return this.collection.findOne({
      "customer.phone": phone,
      paymentMethod: "cash_on_delivery",
      createdAt: { $gte: sinceIso },
    });
  }

  async create(doc) {
    try {
      const insertResult = await this.collection.insertOne(doc);
      doc._id = doc._id ?? insertResult.insertedId;
      return doc;
      
    } catch (error) {
      console.log(JSON.stringify(error, null, 2))
      throw new Error(error)
    }
  }

  async updateStatus(id, status) {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    return result.value ?? null;
  }
}

class FileOrdersStore {
  constructor(filePath) {
    this.filePath = filePath;
  }

  async readAll() {
    try {
      const raw = await fs.readFile(this.filePath, "utf8");
      if (!raw.trim()) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      if (error && error.code === "ENOENT") return [];
      console.warn("[orders:fallback] failed to read cache file", error);
      return [];
    }
  }

  async writeAll(orders) {
    await ensureDir(this.filePath);
    const trimmed = orders.slice(-FALLBACK_LIMIT);
    await fs.writeFile(this.filePath, JSON.stringify(trimmed, null, 2), "utf8");
  }

  async list(limit) {
    const orders = await this.readAll();
    const sorted = orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
      );
    return sorted.slice(0, limit);
  }

  async findRecentCashOrderByPhone(phone, sinceIso) {
    const orders = await this.readAll();
    const since = new Date(sinceIso).getTime();
    return (
      orders.find(
        (order) =>
          order?.paymentMethod === "cash_on_delivery" &&
          (order?.customer?.phone ?? "") === phone &&
          new Date(order?.createdAt ?? 0).getTime() >= since
      ) ?? null
    );
  }

  async create(doc) {
    const orders = await this.readAll();
    const stored = cloneOrder(doc);
    orders.push(stored);
    await this.writeAll(orders);
    return stored;
  }

  async updateStatus(id, status) {
    const orders = await this.readAll();
    const index = orders.findIndex((order) => order?.id === id);
    if (index === -1) return null;
    const updated = {
      ...orders[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    orders[index] = updated;
    await this.writeAll(orders);
    return updated;
  }
}

class MemoryOrdersStore {
  constructor(initialOrders = []) {
    this.orders = initialOrders.map(cloneOrder);
  }

  replaceAll(orders) {
    this.orders = orders.map(cloneOrder);
  }

  snapshot() {
    return this.orders.map(cloneOrder);
  }

  async list(limit) {
    const sorted = this.orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
      );
    return sorted.slice(0, limit);
  }

  async findRecentCashOrderByPhone(phone, sinceIso) {
    const since = new Date(sinceIso).getTime();
    return (
      this.orders.find(
        (order) =>
          order?.paymentMethod === "cash_on_delivery" &&
          (order?.customer?.phone ?? "") === phone &&
          new Date(order?.createdAt ?? 0).getTime() >= since
      ) ?? null
    );
  }

  async create(doc) {
    const stored = cloneOrder(doc);
    this.orders.push(stored);
    return stored;
  }

  async updateStatus(id, status) {
    const index = this.orders.findIndex((order) => order?.id === id);
    if (index === -1) return null;
    const updated = {
      ...this.orders[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    this.orders[index] = updated;
    return updated;
  }
}

const READONLY_FS_ERROR_CODES = new Set(["EACCES", "EPERM", "EROFS", "ENOSPC"]);

const fileFallbackStore = new FileOrdersStore(fallbackFilePath);
const memoryFallbackStore = new MemoryOrdersStore();
let activeFallbackStore = fileFallbackStore;
let fallbackStoreType = "file";

const isReadOnlyFsError = (error) => READONLY_FS_ERROR_CODES.has(error?.code);

const switchToMemoryFallback = async (error) => {
  if (fallbackStoreType === "memory") {
    throw error;
  }
  console.warn(
    `[orders:fallback] write failed (${error?.code ?? error}). Switching to in-memory store.`
  );
  const existingOrders = await fileFallbackStore.readAll().catch(() => []);
  const memorySnapshot = memoryFallbackStore.snapshot();
  const seenIds = new Set(existingOrders.map((order) => order?.id).filter(Boolean));
  for (const order of memorySnapshot) {
    if (!seenIds.has(order?.id)) {
      existingOrders.push(order);
      if (order?.id) {
        seenIds.add(order.id);
      }
    }
  }
  memoryFallbackStore.replaceAll(existingOrders);
  activeFallbackStore = memoryFallbackStore;
  fallbackStoreType = "memory";
};

const withReadonlyGuard = (method) => {
  return async (...args) => {
    try {
      return await activeFallbackStore[method](...args);
    } catch (error) {
      if (activeFallbackStore === fileFallbackStore && isReadOnlyFsError(error)) {
        await switchToMemoryFallback(error);
        return activeFallbackStore[method](...args);
      }
      throw error;
    }
  };
};

const fallbackStore = {
  list: withReadonlyGuard("list"),
  findRecentCashOrderByPhone: withReadonlyGuard("findRecentCashOrderByPhone"),
  create: withReadonlyGuard("create"),
  updateStatus: withReadonlyGuard("updateStatus"),
};
let cachedMongoStore = null;

export const resolveOrdersStore = async () => {
  if (cachedMongoStore) {
    return { type: "mongo", store: cachedMongoStore };
  }

  try {
    const { db } = await connectToDb();
    const store = new MongoOrdersStore(db.collection("orders"));
    cachedMongoStore = store;
    console.log("[orders] using MongoDB orders store");
    return { type: "mongo", store };
  } catch (error) {
    console.warn(
      `[orders] MongoDB unavailable, using local fallback store: ${error?.message ?? error}`
    );
    return { type: fallbackStoreType, store: fallbackStore };
  }
};

export const resetOrdersStoreCache = () => {
  cachedMongoStore = null;
  activeFallbackStore = fileFallbackStore;
  fallbackStoreType = "file";
};
