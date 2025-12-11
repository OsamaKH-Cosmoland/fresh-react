import { MongoOrdersRepository } from "./MongoOrdersRepository";
import { runOrdersRepositoryContract } from "./testing/ordersRepository.contract";
import type { MongoClient, Db, Collection } from "mongodb";
import type { Order } from "../../domain/shared/Order";

/**
 * Contract runner for MongoOrdersRepository.
 * Skipped by default unless MONGODB_URI and MONGODB_DB are provided.
 */
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri || !dbName) {
  describe.skip("MongoOrdersRepository contract", () => {
    it("skipped because no Mongo test database is configured", () => {
      /* noop */
    });
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

    runOrdersRepositoryContract("MongoOrdersRepository", () => new MongoOrdersRepository(collection));
  });
}
