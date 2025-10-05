import { MongoClient, ObjectId } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDb() {
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

export default async function handler(req, res) {
  try {
    const { db } = await connectToDb();
    const col = db.collection("fruits");

    if (req.method === "GET") {
      const docs = await col.find({}).sort({ _id: -1 }).toArray();
      return res.status(200).json(docs);
    }

    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const name = String(body?.name || "").trim();
      const price = Number(body?.price);
      if (!name || Number.isNaN(price) || price < 0) {
        return res.status(400).json({ error: "Invalid name or price" });
      }
      const result = await col.insertOne({ name, price });
      return res.status(201).json({ _id: result.insertedId, name, price });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "Missing id" });
      await col.deleteOne({ _id: new ObjectId(id) });
      return res.status(204).end();
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end("Method Not Allowed");
  } catch (err) {
    console.error("API /api/fruits error:", err);
    // Keep error minimal in prod:
    return res.status(500).json({ error: "Server error" });
  }
}
