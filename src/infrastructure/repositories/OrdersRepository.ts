import type { Order } from "../../domain/shared/Order";

export interface OrdersRepository {
  list(limit?: number): Promise<Order[]>;
  findRecentCashOrderByPhone(phone: string, sinceIso: string | Date): Promise<Order | null>;
  create(order: Order): Promise<Order>;
  updateStatus(id: string, status: string): Promise<Order | null>;
}
