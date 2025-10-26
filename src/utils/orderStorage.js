const STORAGE_KEY = "naturagloss.orders.v1";

const safeParse = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn("Failed to parse saved orders", error);
    return null;
  }
};

const canUseStorage = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function readOrders() {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function writeOrders(orders) {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (error) {
    console.warn("Unable to write orders", error);
  }
}

export function addOrder(order) {
  const existing = readOrders();
  const next = [order, ...existing];
  writeOrders(next);
  return order;
}

export const ORDER_STORAGE_KEY = STORAGE_KEY;
