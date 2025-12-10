import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { PROMO_CODES } from "@/discounts/promoCodes";
import {
  evaluatePromoForCart,
  type AppliedPromo,
  type ApplyPromoResult,
} from "@/discounts/discountEngine";
import {
  applyCreditToAmount,
  findCreditByCode,
  seedManualCreditsOnce,
} from "@/utils/giftCreditStorage";

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
  productId?: string;
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

interface StoredCartPayload {
  items: CartItem[];
  activePromoCode?: string | null;
  appliedPromo?: AppliedPromo | null;
  giftCreditCode?: string | null;
  giftCreditAppliedAmountBase?: number;
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
  activePromoCode: string | null;
  appliedPromo: AppliedPromo | null;
  giftCreditCode: string | null;
  giftCreditAppliedAmountBase: number;
};

type CartAction =
  | {
      type: "hydrate";
      payload: {
        items: CartItem[];
        savedCarts: SavedCart[];
        activeSavedCartId: string | null;
        activePromoCode?: string | null;
        appliedPromo?: AppliedPromo | null;
        giftCreditCode?: string | null;
        giftCreditAppliedAmountBase?: number;
      };
    }
  | { type: "add"; payload: CartItem }
  | { type: "update"; payload: { id: string; quantity: number } }
  | { type: "remove"; payload: { id: string } }
  | { type: "clear" }
  | { type: "set-saved"; payload: SavedCart[] }
  | { type: "load-saved"; payload: { items: CartItem[]; activeSavedCartId: string | null } }
  | { type: "set-promo"; payload: { activePromoCode: string | null; appliedPromo: AppliedPromo | null } }
  | { type: "apply-gift-credit"; payload: { code: string; appliedAmountBase: number } }
  | { type: "clear-gift-credit" };

const DEFAULT_GIFT_CREDIT_STATE = {
  giftCreditCode: null as string | null,
  giftCreditAppliedAmountBase: 0,
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "hydrate":
      return {
        items: action.payload.items,
        savedCarts: action.payload.savedCarts,
        activeSavedCartId: action.payload.activeSavedCartId,
        activePromoCode: action.payload.activePromoCode ?? null,
        appliedPromo: action.payload.appliedPromo ?? null,
        giftCreditCode: action.payload.giftCreditCode ?? null,
        giftCreditAppliedAmountBase: action.payload.giftCreditAppliedAmountBase ?? 0,
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
        activePromoCode: null,
        appliedPromo: null,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    }
    case "update": {
      if (action.payload.quantity <= 0) {
        return {
          items: state.items.filter((item) => item.id !== action.payload.id),
          savedCarts: state.savedCarts,
          activeSavedCartId: null,
          activePromoCode: null,
          appliedPromo: null,
          ...DEFAULT_GIFT_CREDIT_STATE,
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
        activePromoCode: null,
        appliedPromo: null,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    }
    case "remove":
      return {
        items: state.items.filter((item) => item.id !== action.payload.id),
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        activePromoCode: null,
        appliedPromo: null,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    case "clear":
      return {
        items: [],
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        activePromoCode: null,
        appliedPromo: null,
        ...DEFAULT_GIFT_CREDIT_STATE,
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
        activePromoCode: null,
        appliedPromo: null,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    case "set-promo":
      return {
        ...state,
        activePromoCode: action.payload.activePromoCode,
        appliedPromo: action.payload.appliedPromo,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    case "apply-gift-credit":
      return {
        ...state,
        giftCreditCode: action.payload.code,
        giftCreditAppliedAmountBase: action.payload.appliedAmountBase,
        updatedAt: Date.now(),
      };
    case "clear-gift-credit":
      return {
        ...state,
        ...DEFAULT_GIFT_CREDIT_STATE,
        updatedAt: Date.now(),
      };
    default:
      return state;
  }
};

export type GiftCreditApplyStatus = "ok" | "not_found" | "exhausted" | "invalid";

export type ApplyGiftCreditResult =
  | { status: "ok"; appliedAmountBase: number; code: string }
  | { status: "not_found" | "exhausted" | "invalid" };

interface CartContextValue {
  cartItems: CartItem[];
  totalQuantity: number;
  subtotal: number;
  savedCarts: SavedCart[];
  activeSavedCartId: string | null;
  activePromoCode: string | null;
  appliedPromo: AppliedPromo | null;
  discountTotal: number;
  giftCreditCode: string | null;
  giftCreditAppliedAmountBase: number;
  grandTotalBase: number;
  creditAppliedBase: number;
  grandTotalAfterCreditBase: number;
  lastUpdatedAt: number;
  applyGiftCredit: (code: string, orderTotalBase?: number) => ApplyGiftCreditResult;
  clearGiftCredit: () => void;
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
  applyPromoCode: (code: string, shippingCost?: number) => ApplyPromoResult;
  clearPromoCode: () => void;
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

function sanitizeCartItems(items: CartItem[]): CartItem[] {
  return items.map((item) => ({
    ...item,
    quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
  }));
}

function readStoredCartPayload(): StoredCartPayload {
  if (typeof window === "undefined") return { items: [] };
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return { items: [] };
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return { items: sanitizeCartItems(parsed) };
    }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.items)) {
      return {
        items: sanitizeCartItems(parsed.items),
        activePromoCode: parsed.activePromoCode ?? null,
        appliedPromo: parsed.appliedPromo ?? null,
        giftCreditCode: parsed.giftCreditCode ?? null,
        giftCreditAppliedAmountBase: parsed.giftCreditAppliedAmountBase ?? 0,
      };
    }
  } catch (error) {
    console.error("Failed to read saved cart:", error);
  }
  return { items: [] };
}

function rehydrateStoredPromo(payload: StoredCartPayload): {
  activePromoCode: string | null;
  appliedPromo: AppliedPromo | null;
} {
  const candidate = payload.activePromoCode?.trim().toUpperCase();
  if (!candidate) {
    return { activePromoCode: null, appliedPromo: null };
  }
  const promo = PROMO_CODES.find((entry) => entry.code === candidate && entry.isActive);
  if (!promo) {
    return { activePromoCode: null, appliedPromo: null };
  }
  const subtotal = payload.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const evaluation = evaluatePromoForCart(promo, { items: payload.items, subtotal }, 0);
  if (!evaluation) {
    return { activePromoCode: null, appliedPromo: null };
  }
  return { activePromoCode: promo.code, appliedPromo: evaluation };
}

function createInitialState(): CartState {
  const stored = readStoredCartPayload();
  const promoState = rehydrateStoredPromo(stored);
  return {
    items: stored.items,
    savedCarts: readSavedCarts(),
    activeSavedCartId: null,
    activePromoCode: promoState.activePromoCode,
    appliedPromo: promoState.appliedPromo,
    giftCreditCode: stored.giftCreditCode ?? null,
    giftCreditAppliedAmountBase: stored.giftCreditAppliedAmountBase ?? 0,
    updatedAt: Date.now(),
  };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, undefined, createInitialState);

  useEffect(() => {
    seedManualCreditsOnce();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          items: state.items,
          activePromoCode: state.activePromoCode,
          appliedPromo: state.appliedPromo,
          giftCreditCode: state.giftCreditCode,
          giftCreditAppliedAmountBase: state.giftCreditAppliedAmountBase,
        })
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [
    state.items,
    state.activePromoCode,
    state.appliedPromo,
    state.giftCreditCode,
    state.giftCreditAppliedAmountBase,
  ]);

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
  const discountTotal = state.appliedPromo?.discountAmount ?? 0;
  const grandTotalBase = Math.max(subtotal - discountTotal, 0);
  const creditAppliedBase = state.giftCreditAppliedAmountBase ?? 0;
  const grandTotalAfterCreditBase = Math.max(grandTotalBase - creditAppliedBase, 0);
  const applyPromoCode = (code: string, shippingCost = 0): ApplyPromoResult => {
    const normalized = code.trim().toUpperCase();
    if (!normalized) {
      return { status: "invalid" };
    }
    const promo = PROMO_CODES.find((entry) => entry.code === normalized);
    if (!promo || !promo.isActive) {
      return { status: "invalid" };
    }
    const evaluation = evaluatePromoForCart(promo, { items: state.items, subtotal }, shippingCost);
    if (!evaluation) {
      return { status: "not_applicable" };
    }
    dispatch({
      type: "set-promo",
      payload: { activePromoCode: promo.code, appliedPromo: evaluation },
    });
    return { status: "applied", applied: evaluation };
  };
  const clearPromoCode = () => {
    if (!state.activePromoCode && !state.appliedPromo) {
      return;
    }
    dispatch({ type: "set-promo", payload: { activePromoCode: null, appliedPromo: null } });
  };

  const applyGiftCredit = (
    code: string,
    orderTotalBaseOverride?: number
  ): ApplyGiftCreditResult => {
    const normalized = code.trim();
    if (!normalized) {
      return { status: "invalid" };
    }
    const credit = findCreditByCode(normalized);
    if (!credit) {
      return { status: "not_found" };
    }
    if (credit.status !== "active") {
      return { status: "invalid" };
    }
    if (credit.remainingAmountBase <= 0) {
      return { status: "exhausted" };
    }
    const targetTotal =
      typeof orderTotalBaseOverride === "number"
        ? Math.max(orderTotalBaseOverride, 0)
        : grandTotalBase;
    const { appliedAmountBase } = applyCreditToAmount(credit, targetTotal);
    if (!appliedAmountBase) {
      return { status: "exhausted" };
    }
    dispatch({
      type: "apply-gift-credit",
      payload: {
        code: credit.code,
        appliedAmountBase,
      },
    });
    return {
      status: "ok",
      appliedAmountBase,
      code: credit.code,
    };
  };

  const clearGiftCredit = () => {
    if (!state.giftCreditCode && !state.giftCreditAppliedAmountBase) {
      return;
    }
    dispatch({ type: "clear-gift-credit" });
  };

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
      payload: {
        items,
        savedCarts: state.savedCarts,
        activeSavedCartId: null,
        activePromoCode: null,
        appliedPromo: null,
      },
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
    activePromoCode: state.activePromoCode,
    appliedPromo: state.appliedPromo,
    discountTotal,
    giftCreditCode: state.giftCreditCode,
    giftCreditAppliedAmountBase: state.giftCreditAppliedAmountBase,
    grandTotalBase,
    creditAppliedBase,
    grandTotalAfterCreditBase,
    lastUpdatedAt: state.updatedAt,
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
    applyPromoCode,
    clearPromoCode,
    applyGiftCredit,
    clearGiftCredit,
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export { cartReducer, CartState, CartAction, STORAGE_KEY, SAVED_CART_KEY, createInitialState };
