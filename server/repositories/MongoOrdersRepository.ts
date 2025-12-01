// MongoDB-backed orders repository.
import type { Collection } from "mongodb";
import type { Order } from "../domain/Order";
import type { OrdersRepository } from "./OrdersRepository";
import { createFakeIdGenerator } from "../../shared/fakeId";

const nextId = createFakeIdGenerator("NG");

export class MongoOrdersRepository implements OrdersRepository {
  constructor(private collection: Collection<Order>) {}

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
    const payload: Order = { ...doc, id: doc.id || nextId() };
    const insertResult = await this.collection.insertOne(payload);
    payload._id = payload._id ?? insertResult.insertedId;
    return payload;
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const result = await this.collection.findOneAndUpdate(
      { id },
      { $set: { status, updatedAt: new Date().toISOString() } },
      { returnDocument: "after" }
    );
    const updated = (result as any)?.value as Order | null;
    return updated ?? null;
  }
}
