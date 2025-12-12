import "dotenv/config";
import { MongoClient, type Db } from "mongodb";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDb(configProvider?: ConfigProvider): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const provider = configProvider ?? new EnvConfigProvider();
  const uri = provider.get("MONGODB_URI");
  const dbName = provider.get("MONGODB_DB");
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
