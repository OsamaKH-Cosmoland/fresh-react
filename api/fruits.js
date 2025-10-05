import { MongoClient, ObjectId } from "mongodb";

let cachedClient = null;
let cachedDb = null;

function mask(str = "", keep = 4) {
  if (!str) return "";
  return str.slice(0, keep) + "…";
}

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

export default async function handler(req, res) {
  try {
    // ---------- DIAG: show env BEFORE connecting ----------
    if (req.query.diag === "env") {
      const uri = process.env.MONGODB_URI || "";
      let host = "";
      try {
        // Parse the SRV URI to extract host part after '@'
        const afterAt = uri.split("@")[1] || "";
        host = afterAt.split("/")[0] || "";
      } catch {}
      return res.status(200).json({
        ok: 1,
        hasURI: Boolean(process.env.MONGODB_URI),
        hasDB: Boolean(process.env.MONGODB_DB),
        dbName: process.env.MONGODB_DB || null,
        // masked previews (no secrets)
        uriPreview: mask(process.env.MONGODB_URI || "", 20),
        host,                       // should look like cluster0.xxxxxx.mongodb.net (NO 'xxxxx' placeholders!)
        hint: "host must be your real cluster host from Atlas (e.g., cluster0.ab1cd.mongodb.net)",
      });
    }

    // ---------- DIAG: attempt connection and ping ----------
    if (req.query.diag === "ping") {
      const { db } = await connectToDb();
      const admin = db.admin();
      const ping = await admin.ping();
      return res.status(200).json({ ok: 1, dbName: db.databaseName, ping });
    }

    // ---------- Normal API ----------
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
    return res.status(500).json({
      error: "Server error",
      detail: err?.message || String(err),
    });
  }
}
