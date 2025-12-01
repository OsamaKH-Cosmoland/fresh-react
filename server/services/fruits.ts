// Fruit services: CRUD helpers wrapping Mongo collections.
import { MongoClient, ObjectId, type Db, type Collection } from "mongodb";
import type { Fruit } from "../domain/Fruit";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

const readBody = (body: unknown) => (typeof body === "string" ? JSON.parse(body) : body);

async function connect(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb };
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB;
  if (!uri || !dbName) throw new Error("Missing MONGODB_URI or MONGODB_DB env vars");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  cachedClient = client;
  cachedDb = db;
  return { client, db };
}

export async function listFruits() {
  const { db } = await connect();
  const col: Collection<Fruit> = db.collection("fruits");
  const docs = await col.find({}).sort({ _id: -1 }).toArray();
  return docs.map(({ _id, ...rest }: any) => ({ _id: _id?.toString(), ...rest }));
}

export async function createFruit(raw: unknown) {
  const { db } = await connect();
  const col: Collection<Fruit> = db.collection("fruits");
  const body = readBody(raw) as Partial<Fruit>;
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

export async function deleteFruit(id?: string) {
  const { db } = await connect();
  const col: Collection<Fruit> = db.collection("fruits");
  if (!id) {
    await col.deleteMany({});
    return { ok: true };
  }
  await col.deleteOne({ _id: new ObjectId(id) });
  return { ok: true };
}

export async function updateFruit(id: string, raw: unknown) {
  const { db } = await connect();
  const col: Collection<Fruit> = db.collection("fruits");
  const body = readBody(raw) as Partial<Fruit>;
  const name = String(body?.name || "").trim();
  const price = Number(body?.price);

  const result = await col.findOneAndUpdate(
    { _id: new ObjectId(id) },
    { $set: { name, price } },
    { returnDocument: "after" }
  );
  const updated = (result as any)?.value as Fruit | null;
  if (!updated) {
    const err: any = new Error("Not found");
    err.statusCode = 404;
    throw err;
  }
  const { _id, ...rest } = updated;
  return { _id: _id ? _id.toString() : "", ...rest };
}
