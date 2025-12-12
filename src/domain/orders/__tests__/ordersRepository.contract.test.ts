import fs from "fs/promises";
import os from "os";
import path from "path";
import type { Collection, Db, MongoClient } from "mongodb";
import { FileOrdersRepository } from "@/infrastructure/repositories/FileOrdersRepository";
import { InMemoryOrdersRepository } from "@/infrastructure/repositories/InMemoryOrdersRepository";
import { MongoOrdersRepository } from "@/infrastructure/repositories/MongoOrdersRepository";
import { runOrdersRepositoryContract } from "@/domain/orders/testing/ordersRepository.contract";
import type { Order } from "@/domain/shared/Order";

runOrdersRepositoryContract({
  name: "InMemoryOrdersRepository",
  create: () => new InMemoryOrdersRepository(),
});

const buildFileFactory = () => {
  let workingDir: string | null = null;

  return {
    name: "FileOrdersRepository",
    create: () => {
      const dir = path.join(os.tmpdir(), `orders-file-${Date.now()}-${Math.random().toString(36).slice(2)}`);
      workingDir = dir;
      const filePath = path.join(dir, "orders.json");
      return new FileOrdersRepository(filePath);
    },
    cleanup: async () => {
      if (!workingDir) return;
      await fs.rm(workingDir, { recursive: true, force: true }).catch(() => {});
      workingDir = null;
    },
  };
};

runOrdersRepositoryContract(buildFileFactory());

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  describe.skip("MongoOrdersRepository contract", () => {
    it("skipped because no Mongo test database is configured", () => {});
  });
} else {
  describe("MongoOrdersRepository contract", () => {
    let client: MongoClient;
    let db: Db;
    let collection: Collection<Order>;

    beforeAll(async () => {
      const mongo = await import("mongodb");
      client = new mongo.MongoClient(uri);
      await client.connect();
      db = client.db(dbName);
      collection = db.collection<Order>("orders_contract_tests");
    });

    beforeEach(async () => {
      await collection.deleteMany({});
    });

    afterAll(async () => {
      await collection.drop().catch(() => {});
      await client.close();
    });

    runOrdersRepositoryContract({
      name: "MongoOrdersRepository",
      create: () => new MongoOrdersRepository(collection),
    });
  });
}
