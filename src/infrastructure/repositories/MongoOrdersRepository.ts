import type { Collection } from "mongodb";
import type { Order } from "../../domain/shared/Order";
import type { OrdersRepository } from "./OrdersRepository";
import type { Clock } from "../../domain/shared/Clock";
import type { IdGenerator } from "../../domain/shared/IdGenerator";
import { DefaultIdGenerator } from "../ids/DefaultIdGenerator";
import { SystemClock } from "../time/SystemClock";

export class MongoOrdersRepository implements OrdersRepository {
  constructor(
    private collection: Collection<Order>,
    private readonly idGenerator: IdGenerator = new DefaultIdGenerator("NG"),
    private readonly clock: Clock = new SystemClock()
  ) {}

  async list(limit = 50): Promise<Order[]> {
    const docs = await this.collection.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
    return docs;
  }

  async findRecentCashOrderByPhone(phone: string, sinceIso: string | Date): Promise<Order | null> {
    return this.collection.findOne({
      "customer.phone": phone,
      paymentMethod: "cash_on_delivery",
      createdAt: { $gte: sinceIso },
    });
  }

  async create(doc: Order): Promise<Order> {
    const payload: Order = { ...doc, id: doc.id || this.idGenerator.nextId() };
    const insertResult = await this.collection.insertOne(payload);
    payload._id = payload._id ?? insertResult.insertedId;
    return payload;
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: this.clock.now().toISOString() } },
      { returnDocument: "after" }
    );
    const updated = (result as any)?.value as Order | null;
    return updated ?? null;
  }
}
