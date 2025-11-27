import { connectToDb } from "../_db";
import type { OrdersRepository } from "./OrdersRepository";
import { FileOrdersRepository, ReadonlyGuardRepository, fallbackFilePath } from "./FileOrdersRepository";
import { InMemoryOrdersRepository } from "./InMemoryOrdersRepository";
import { MongoOrdersRepository } from "./MongoOrdersRepository";

let cachedMongoRepo: OrdersRepository | null = null;
let fallbackRepo: OrdersRepository | null = null;

export const resolveOrdersRepository = async (): Promise<{ type: string; store: OrdersRepository }> => {
  if (cachedMongoRepo) return { type: "mongo", store: cachedMongoRepo };

  try {
    const { db } = await connectToDb();
    const store = new MongoOrdersRepository(db.collection("orders"));
    cachedMongoRepo = store;
    return { type: "mongo", store };
  } catch (error: any) {
    const mem = new InMemoryOrdersRepository();
    const file = new FileOrdersRepository(fallbackFilePath);
    fallbackRepo = fallbackRepo ?? new ReadonlyGuardRepository(file, mem);
    console.warn(`[orders] MongoDB unavailable, using local fallback store: ${error?.message ?? error}`);
    return { type: "fallback", store: fallbackRepo };
  }
};

export const resetOrdersRepositoryCache = () => {
  cachedMongoRepo = null;
  fallbackRepo = null;
};
