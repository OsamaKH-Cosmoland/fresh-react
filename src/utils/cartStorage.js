const STORAGE_KEY = "naturagloss-cart";

const isBrowser = typeof window !== "undefined";

export function readCart() {
  if (!isBrowser) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        ...item,
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function writeCart(items) {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors (storage full, etc.)
  }
}

export function addCartItem(items, item) {
  const existing = items.find((entry) => entry.id === item.id);
  if (existing) {
    return items.map((entry) =>
      entry.id === item.id ? { ...entry, quantity: entry.quantity + 1 } : entry
    );
  }
  return [...items, { ...item, quantity: 1 }];
}

export function removeCartItem(items, item) {
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

export function clearCart() {
  return [];
}

export function subscribeToCart(callback) {
  if (!isBrowser) return () => {};
  const handler = (event) => {
    if (event.key === STORAGE_KEY) {
      callback(readCart());
    }
  };
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}
