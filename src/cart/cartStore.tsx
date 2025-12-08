import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "naturagloss_cart";
const SAVED_CART_KEY = "naturagloss_saved_carts";

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
  bundleItems?: { productId: string; name: string; quantity: number }[];
  bundleCompareAt?: number;
  bundleSavings?: number;
  bundleSavingsPercent?: number;
  giftBoxId?: string;
  giftBox?: {
    styleName: string;
    note?: string;
    addons?: string[];
    items: { productId: string; name: string; price: number; quantity: number }[];
    boxPrice: number;
    addonsPrice: number;
  };
}

export interface SavedCart {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

type CartState = {
  items: CartItem[];
  updatedAt: number;
  savedCarts: SavedCart[];
  activeSavedCartId: string | null;
};

type CartAction =
  | { type: "hydrate"; payload: { items: CartItem[]; savedCarts: SavedCart[]; activeSavedCartId: string | null } }
  | { type: "add"; payload: CartItem }
  | { type: "update"; payload: { id: string; quantity: number } }
  | { type: "remove"; payload: { id: string } }
  | { type: "clear" }
  | { type: "set-saved"; payload: SavedCart[] }
  | { type: "load-saved"; payload: { items: CartItem[]; activeSavedCartId: string | null } };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "hydrate":
      return {
        items: action.payload.items,
        savedCarts: action.payload.savedCarts,
        activeSavedCartId: action.payload.activeSavedCartId,
        updatedAt: Date.now(),
      };
    case "add": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      const quantityToAdd = Math.max(1, action.payload.quantity);
      const updatedItems = existing
        ? state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          )
        : [...state.items, { ...action.payload, quantity: quantityToAdd }];
      return {
        items: updatedItems,
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        updatedAt: Date.now(),
      };
    }
    case "update": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== action.payload.id),
          savedCarts: state.savedCarts,
          activeSavedCartId: null,
          updatedAt: Date.now(),
        };
      }
      return {
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        updatedAt: Date.now(),
      };
    }
    case "remove":
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        updatedAt: Date.now(),
      };
    case "clear":
      return {
        items: [],
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        updatedAt: Date.now(),
      };
    case "set-saved":
      return {
        ...state,
        savedCarts: action.payload,
        updatedAt: Date.now(),
      };
    case "load-saved":
      return {
        ...state,
        items: action.payload.items,
        activeSavedCartId: action.payload.activeSavedCartId,
        updatedAt: Date.now(),
      };
    default:
      return state;
  }
};

interface CartContextValue {
  cartItems: CartItem[];
  totalQuantity: number;
  subtotal: number;
  savedCarts: SavedCart[];
  activeSavedCartId: string | null;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
  loadSavedCart: (id: string) => boolean;
  saveCurrentCart: (name: string) => boolean;
  saveCustomCart: (name: string, items: CartItem[]) => boolean;
  deleteSavedCart: (id: string) => boolean;
  renameSavedCart: (id: string, newName: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

function readSavedCarts(): SavedCart[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(SAVED_CART_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (Array.isArray(data)) return data;
    }
  } catch {
    // ignore parse errors
  }
  return [];
}

function readStoredCart() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      if (Array.isArray(data)) return data;
    }
  } catch (error) {
    console.error("Failed to read saved cart:", error);
  }
  return [];
}

function createInitialState(): CartState {
  return {
    items: readStoredCart(),
    savedCarts: readSavedCarts(),
    activeSavedCartId: null,
    updatedAt: Date.now(),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, createInitialState);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [state.items]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(SAVED_CART_KEY, JSON.stringify(state.savedCarts));
    } catch (error) {
      console.error("Failed to save saved carts:", error);
    }
  }, [state.savedCarts]);

  const totalQuantity = useMemo(
    () => state.items.reduce((sum, item) => sum + item.quantity, 0),
    [state.items]
  );

  const subtotal = useMemo(
    () => state.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [state.items]
  );

  const addItem = (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    dispatch({
      type: "add",
      payload: { ...item, quantity: Math.max(1, item.quantity ?? 1) },
    });
  };

  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: "update", payload: { id, quantity } });
  };

  const removeItem = (id: string) => {
    dispatch({ type: "remove", payload: { id } });
  };

  const clearCart = () => {
    dispatch({ type: "clear" });
  };

  const setCart = (items: CartItem[]) => {
    dispatch({
      type: "hydrate",
      payload: { items, savedCarts: state.savedCarts, activeSavedCartId: null },
    });
  };

  const createCartId = () =>
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `cart-${Date.now()}`;

  const saveCurrentCart = (name: string) => {
    const title = name.trim();
    if (!title || state.items.length === 0) return false;
    const timestamp = new Date().toISOString();
    const newCart: SavedCart = {
      id: createCartId(),
      name: title,
      createdAt: timestamp,
      updatedAt: timestamp,
      items: state.items.map((item) => ({ ...item })),
    };
    const next = [newCart, ...state.savedCarts];
    dispatch({ type: "set-saved", payload: next });
    dispatch({ type: "load-saved", payload: { items: state.items, activeSavedCartId: newCart.id } });
    return true;
  };

  const saveCustomCart = (name: string, items: CartItem[]) => {
    const title = name.trim();
    if (!title || items.length === 0) return false;
    const timestamp = new Date().toISOString();
    const newCart: SavedCart = {
      id: createCartId(),
      name: title,
      createdAt: timestamp,
      updatedAt: timestamp,
      items: items.map((item) => ({ ...item })),
    };
    const next = [newCart, ...state.savedCarts];
    dispatch({ type: "set-saved", payload: next });
    return true;
  };

  const loadSavedCart = (id: string) => {
    const saved = state.savedCarts.find((entry) => entry.id === id);
    if (!saved) return false;
    dispatch({
      type: "load-saved",
      payload: {
        items: saved.items.map((item) => ({ ...item })),
        activeSavedCartId: saved.id,
      },
    });
    return true;
  };

  const deleteSavedCart = (id: string) => {
    const filtered = state.savedCarts.filter((entry) => entry.id !== id);
    if (filtered.length === state.savedCarts.length) return false;
    dispatch({ type: "set-saved", payload: filtered });
    if (state.activeSavedCartId === id) {
      dispatch({ type: "load-saved", payload: { items: state.items, activeSavedCartId: null } });
    }
    return true;
  };

  const renameSavedCart = (id: string, newName: string) => {
    const title = newName.trim();
    if (!title) return false;
    let updated = false;
    const renamed = state.savedCarts.map((entry) => {
      if (entry.id !== id) return entry;
      updated = true;
      return { ...entry, name: title, updatedAt: new Date().toISOString() };
    });
    if (!updated) return false;
    dispatch({ type: "set-saved", payload: renamed });
    return true;
  };

  const contextValue = {
    cartItems: state.items,
    totalQuantity,
    subtotal,
    savedCarts: state.savedCarts,
    activeSavedCartId: state.activeSavedCartId,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCart,
    loadSavedCart,
    saveCurrentCart,
    saveCustomCart,
    deleteSavedCart,
    renameSavedCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export { cartReducer, CartState, CartAction, STORAGE_KEY, SAVED_CART_KEY, createInitialState };
