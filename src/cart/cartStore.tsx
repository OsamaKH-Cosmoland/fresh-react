import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";

const STORAGE_KEY = "naturagloss_cart";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

type CartState = {
  items: CartItem[];
  updatedAt: number;
};

type CartAction =
  | { type: "hydrate"; payload: CartItem[] }
  | { type: "add"; payload: CartItem }
  | { type: "update"; payload: { id: string; quantity: number } }
  | { type: "remove"; payload: { id: string } }
  | { type: "clear" };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "hydrate": {
      return { items: action.payload, updatedAt: Date.now() };
    }
    case "add": {
      const existing = state.items.find((item) => item.id === action.payload.id);
      const quantityToAdd = Math.max(1, action.payload.quantity);
      if (existing) {
        return {
          items: state.items.map((item) =>
            item.id === action.payload.id
              ? { ...item, quantity: item.quantity + quantityToAdd }
              : item
          ),
          updatedAt: Date.now(),
        };
      }
      return {
        items: [...state.items, { ...action.payload, quantity: quantityToAdd }],
        updatedAt: Date.now(),
      };
    }
    case "update": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== action.payload.id),
          updatedAt: Date.now(),
        };
      }
      return {
        items: state.items.map((item) =>
          item.id === action.payload.id
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
        updatedAt: Date.now(),
      };
    }
    case "remove":
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
        updatedAt: Date.now(),
      };
    case "clear":
      return {
        items: [],
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
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setCart: (items: CartItem[]) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

export function cartInitializer(): CartState {
  if (typeof window === "undefined") {
    return { items: [], updatedAt: Date.now() };
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored) as CartItem[];
      if (Array.isArray(data)) {
        return { items: data, updatedAt: Date.now() };
      }
    }
  } catch (error) {
    console.error("Failed to read saved cart:", error);
  }
  return { items: [], updatedAt: Date.now() };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => cartInitializer());

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [state.items]);

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
    dispatch({ type: "hydrate", payload: items });
  };

  const contextValue = {
    cartItems: state.items,
    totalQuantity,
    subtotal,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    setCart,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}
