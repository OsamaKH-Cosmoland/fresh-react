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
    const insertResult = await this.collection.insertOne(doc);
    doc._id = doc._id ?? insertResult.insertedId;
    return doc;
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

const fallbackStore = new FileOrdersStore(fallbackFilePath);
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
    return { type: "file", store: fallbackStore };
  }
};

export const resetOrdersStoreCache = () => {
  cachedMongoStore = null;
};
