import type { LocalOrder } from "@/types/localOrder";
import { getLogger } from "@/logging/globalLogger";

const STORAGE_KEY = "naturagloss_orders";
export const ORDERS_UPDATE_EVENT = "naturagloss:orders-updated";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safelyParse = (value: string | null) => {
  if (value == null) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    getLogger().warn("Failed to parse saved orders", { error });
    return null;
  }
};

export function readOrders(): LocalOrder[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safelyParse(raw);
  return Array.isArray(parsed) ? (parsed as LocalOrder[]) : [];
}

export function writeOrders(orders: LocalOrder[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    window.dispatchEvent(new Event(ORDERS_UPDATE_EVENT));
  } catch (error) {
    getLogger().warn("Unable to write orders", { error });
  }
}

export function addOrder(order: LocalOrder): LocalOrder {
  const existing = readOrders();
  const next = [order, ...existing];
  writeOrders(next);
  return order;
}

export const ORDER_STORAGE_KEY = STORAGE_KEY;
