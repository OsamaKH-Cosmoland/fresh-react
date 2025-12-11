import { ObjectId, type Collection } from "mongodb";
import type { Product } from "../../domain/shared/Product";
import { connectToDb } from "../../infrastructure/repositories/_db";

const readBody = (body: unknown) => (typeof body === "string" ? JSON.parse(body) : body);

export async function listProducts() {
  const { db } = await connectToDb();
  const col: Collection<Product> = db.collection("products");
  const docs = await col.find({}).sort({ _id: -1 }).toArray();
  return docs.map(({ _id, ...rest }: any) => ({ _id: _id?.toString(), ...rest }));
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
