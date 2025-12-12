import { ObjectId, type Collection } from "mongodb";
import type { Product } from "../../domain/shared/Product";
import { connectToDb } from "../../infrastructure/repositories/_db";
import type { Cache } from "@/domain/cache/Cache";

const PRODUCTS_CACHE_KEY = "products:list";
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const readBody = (body: unknown) => (typeof body === "string" ? JSON.parse(body) : body);

export type ListProductsOptions = {
  cache?: Cache;
  cacheTtlMs?: number;
  dbFactory?: typeof connectToDb;
};

export async function listProducts(options: ListProductsOptions = {}) {
  const {
    cache,
    cacheTtlMs = DEFAULT_CACHE_TTL_MS,
    dbFactory = connectToDb,
  } = options;
  if (cache) {
    const fromCache = cache.get<Product[]>(PRODUCTS_CACHE_KEY);
    if (fromCache) {
      return fromCache;
    }
  }
  const { db } = await dbFactory();
  const col: Collection<Product> = db.collection("products");
  const docs = await col.find({}).sort({ _id: -1 }).toArray();
  const mapped = docs.map(({ _id, ...rest }: any) => ({ _id: _id?.toString(), ...rest }));
  cache?.set(PRODUCTS_CACHE_KEY, mapped, cacheTtlMs);
  return mapped;
}

export async function createProduct(raw: unknown) {
  const { db } = await connectToDb();
  const col: Collection<Product> = db.collection("products");
  const body = readBody(raw) as Partial<Product>;
  const name = String(body?.name || "").trim();
  const price = Number(body?.price);
  if (!name || Number.isNaN(price) || price < 0) {
    const err: any = new Error("Invalid name or price");
    err.statusCode = 400;
    throw err;
  }
  const result = await col.insertOne({ name, price });
  return { _id: result.insertedId.toString(), name, price };
}

export async function deleteProduct(id?: string) {
  const { db } = await connectToDb();
  const col: Collection<Product> = db.collection("products");
  if (!id) {
    await col.deleteMany({});
    return { ok: true };
  }
  await col.deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}

export async function updateProduct(id: string, raw: unknown) {
  const { db } = await connectToDb();
  const col: Collection<Product> = db.collection("products");
  const body = readBody(raw) as Partial<Product>;
  const name = String(body?.name || "").trim();
  const price = Number(body?.price);

  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { name, price } },
    { returnDocument: "after" }
  );
  const updated = (result as any)?.value as Product | null;
  if (!updated) {
    const err: any = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const { _id, ...rest } = updated;
  return { _id: _id ? _id.toString() : "", ...rest };
}
