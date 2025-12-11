// In-memory orders repository for tests and fallback scenarios.
import type { Order } from "../../domain/shared/Order";
import type { OrdersRepository } from "./OrdersRepository";
import { createFakeIdGenerator } from "../../domain/shared/fakeId";

const nextId = createFakeIdGenerator("NG");

export class InMemoryOrdersRepository implements OrdersRepository {
  private orders: Order[];

  constructor(initialOrders: Order[] = []) {
    this.orders = initialOrders.map((order) => ({ ...order }));
  }

  replaceAll(orders: Order[]) {
    this.orders = orders.map((order) => ({ ...order }));
  }

  snapshot() {
    return this.orders.map((order) => ({ ...order }));
  }

  async list(limit = 50): Promise<Order[]> {
    const sorted = this.orders
      .slice()
      .sort(
        (a, b) =>
          new Date(b?.createdAt ?? 0).getTime() - new Date(a?.createdAt ?? 0).getTime()
      );
    return sorted.slice(0, limit);
  }

  async findRecentCashOrderByPhone(phone: string, sinceIso: string | Date): Promise<Order | null> {
    const since = new Date(sinceIso).getTime();
    return (
      this.orders.find(
        (order) =>
          order?.paymentMethod === "cash_on_delivery" &&
          (order?.customer?.phone ?? "") === phone &&
          new Date(order?.createdAt ?? 0).getTime() >= since
      ) ?? null
    );
  }

  async create(doc: Order): Promise<Order> {
    const stored: Order = { ...doc, id: doc.id || nextId() };
    this.orders.push(stored);
    return stored;
  }

  async updateStatus(id: string, status: string): Promise<Order | null> {
    const index = this.orders.findIndex((order) => order?.id === id);
    if (index === -1) return null;
    const updated: Order = {
      ...this.orders[index],
      status,
      updatedAt: new Date().toISOString(),
    };
    this.orders[index] = updated;
    return updated;
  }
}
