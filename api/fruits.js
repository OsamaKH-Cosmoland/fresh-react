import { MongoClient, ObjectId } from "mongodb";

let cachedClient = null;
let cachedDb = null;

async function connectToDb() {
    if (cachedClient && cachedDb) return { client: cachedClient, db: cachedDb};

    const uri = process.env.MONGODB_URI;
    const dbname = process.env.MONGODB_DB;

    const client =  new MongoClient(uri);
    await client.connect();
    const db = client.db(dbname);

    cachedClient = client;
    cachedDb = db;
    return {client, db};
  }

export default async function handler(req, res) { 
    try {
        const { db } = await connectToDb();
        const fruits = db.collection("fruits");

        if ( req.method === "GET") {
            const docs = await fruits.find({}).toarray();
            return res.status(200).json(docs);
        }

        if (req.method === "POST") {
            const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
            const { name, price } = body;
            if ( !name || price) {
                return res.status(400).json({ error: "name and price are required"});
            }
            const result = await fruits.insertOne({ name, price: Number(price) });
            return res.status(201).json({ _id: result.insertedId, name, price});
        }
        
        res.setHeader("Allow", ["GET", "POST"]);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database connection failed"});
    }
}