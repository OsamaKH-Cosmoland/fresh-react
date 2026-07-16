import { connectToDb } from "./_db.js";
import type { OrdersRepository } from "./OrdersRepository.js";
import { FileOrdersRepository, ReadonlyGuardRepository } from "./FileOrdersRepository.js";
import { InMemoryOrdersRepository } from "./InMemoryOrdersRepository.js";
import { MongoOrdersRepository } from "./MongoOrdersRepository.js";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { EnvConfigProvider, DEFAULT_ORDERS_FALLBACK_PATH } from "@/infrastructure/config/EnvConfigProvider";
import { getLogger } from "@/logging/globalLogger";

let cachedMongoRepo: OrdersRepository | null = null;
let fallbackRepo: OrdersRepository | null = null;

export const resolveOrdersRepository = async (
  configProvider?: ConfigProvider
): Promise<{ type: string; store: OrdersRepository }> => {
  if (cachedMongoRepo) return { type: "mongo", store: cachedMongoRepo };

  try {
    const { db } = await connectToDb(configProvider);
    const store = new MongoOrdersRepository(db.collection("orders"));
    cachedMongoRepo = store;
    return { type: "mongo", store };
  } catch (error: any) {
    const mem = new InMemoryOrdersRepository();
    const provider = configProvider ?? new EnvConfigProvider();
    const fallbackPath = provider.get("ORDERS_FALLBACK_PATH") ?? DEFAULT_ORDERS_FALLBACK_PATH;
    const file = new FileOrdersRepository(fallbackPath);
    fallbackRepo = fallbackRepo ?? new ReadonlyGuardRepository(file, mem);
    getLogger().warn("[orders] MongoDB unavailable, using fallback store", {
      error,
    });
    return { type: "fallback", store: fallbackRepo };
  }
};

export const resetOrdersRepositoryCache = () => {
  cachedMongoRepo = null;
  fallbackRepo = null;
};
