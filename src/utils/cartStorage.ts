import type { Product } from "../types/product";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
  variantAttributes?: Record<string, string>;
  imageUrl?: string;
  bundleId?: string;
  bundleItems?: {
    productId: string;
    name: string;
    quantity: number;
    variantId?: string;
    variantLabel?: string;
    variantAttributes?: Record<string, string>;
  }[];
  bundleCompareAt?: number;
  bundleSavings?: number;
  bundleSavingsPercent?: number;
  giftBoxId?: string;
  giftBox?: {
    styleName: string;
    note?: string;
    addons?: string[];
    items: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
      variantId?: string;
      variantLabel?: string;
      variantAttributes?: Record<string, string>;
    }[];
    boxPrice: number;
    addonsPrice: number;
  };
}

const STORAGE_KEY = "naturagloss-cart";

const isBrowser = typeof window !== "undefined";

export function readCart(): CartItem[] {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      })) as CartItem[];
    }
    return [];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors (storage full, etc.)
  }
}

export function addCartItem(items: CartItem[], item: Product): CartItem[] {
  const existing = items.find((entry) => entry.id === item.id);
  if (existing) {
    return items.map((entry) =>
      entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
    );
  }
  return [...items, { ...item, quantity: 1 }];
}

export function removeCartItem(items: CartItem[], item: Product): CartItem[] {
  const existing = items.find((entry) => entry.id === item.id);
  if (!existing) {
    return items;
  }
  if (existing.quantity <= 1) {
    return items.filter((entry) => entry.id !== item.id);
  }
  return items.map((entry) =>
    entry.id === item.id ? { ...entry, quantity: entry.quantity - 1 } : entry
  );
}

export function clearCart(): CartItem[] {
  return [];
}

export function subscribeToCart(callback: (items: CartItem[]) => void): () => void {
  if (!isBrowser) return () => {};
  const handler = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      callback(readCart());
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
