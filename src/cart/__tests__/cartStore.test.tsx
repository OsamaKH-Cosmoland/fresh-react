import type { ReactNode } from "react";
import { renderHook, act } from "@testing-library/react";
import {
  CartProvider,
  useCart,
  cartReducer,
  CartState,
  CartAction,
  CartItem,
  SavedCart,
  STORAGE_KEY,
  SAVED_CART_KEY,
} from "@/cart/cartStore";

const wrapper = ({ children }: { children?: ReactNode }) => <CartProvider>{children}</CartProvider>;

const baseState: CartState = {
  items: [],
  savedCarts: [],
  activeSavedCartId: null,
  activePromoCode: null,
  appliedPromo: null,
  updatedAt: 0,
};

const sampleItem: CartItem = { id: "bundle", name: "Bundle", price: 25, quantity: 1 };

describe("cartReducer", () => {
  it("adds new items and merges quantities", () => {
    const stateAfterFirst = cartReducer(baseState, { type: "add", payload: { ...sampleItem, quantity: 2 } });
    expect(stateAfterFirst.items).toHaveLength(1);
    expect(stateAfterFirst.items[0].quantity).toBe(2);

    const stateAfterSecond = cartReducer(stateAfterFirst, { type: "add", payload: { ...sampleItem, quantity: 3 } });
    expect(stateAfterSecond.items[0].quantity).toBe(5);
    expect(stateAfterSecond.activeSavedCartId).toBeNull();
  });

  it("updates quantity or removes items", () => {
    const filledState = {
      ...baseState,
      items: [{ ...sampleItem, quantity: 2 }],
      savedCarts: [],
      activeSavedCartId: "existing",
    };
    const updated = cartReducer(filledState, { type: "update", payload: { id: sampleItem.id, quantity: 5 } });
    expect(updated.items[0].quantity).toBe(5);
    expect(updated.activeSavedCartId).toBeNull();

    const removed = cartReducer(updated, { type: "update", payload: { id: sampleItem.id, quantity: 0 } });
    expect(removed.items).toHaveLength(0);
  });

  it("removes and clears items", () => {
    const filledState = {
      ...baseState,
      items: [{ ...sampleItem, quantity: 2 }],
      savedCarts: [],
      activeSavedCartId: "active",
    };
    const afterRemove = cartReducer(filledState, { type: "remove", payload: { id: sampleItem.id } });
    expect(afterRemove.items).toHaveLength(0);

    const cleared = cartReducer(filledState, { type: "clear" });
    expect(cleared.items).toHaveLength(0);
  });

  it("loads saved items without touching saved list", () => {
    const saved: SavedCart = {
      id: "ritual-1",
      name: "Ritual One",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: [{ ...sampleItem, quantity: 3 }],
    };
    const stateWithSaved = {
      ...baseState,
      savedCarts: [saved],
    };
    const loaded = cartReducer(stateWithSaved, {
      type: "load-saved",
      payload: { items: saved.items, activeSavedCartId: saved.id },
    });
    expect(loaded.items[0].quantity).toBe(3);
    expect(loaded.activeSavedCartId).toBe(saved.id);
  });
});

describe("CartProvider logic", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("manages totals and clear", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "a", name: "A", price: 10 }));
    act(() => result.current.addItem({ id: "a", name: "A", price: 10, quantity: 2 }));
    expect(result.current.totalQuantity).toBe(3);
    expect(result.current.subtotal).toBe(30);
    act(() => result.current.clearCart());
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.totalQuantity).toBe(0);
  });

  it("saves, loads, renames, and deletes rituals", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "ritual", name: "Ritual", price: 50 }));
    act(() => result.current.saveCurrentCart("Evening Ritual"));

    const saved = result.current.savedCarts[0];
    expect(saved).toBeDefined();
    expect(saved.name).toBe("Evening Ritual");

    act(() => result.current.loadSavedCart(saved.id));
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.cartItems[0].quantity).toBe(saved.items[0].quantity);

    act(() => result.current.renameSavedCart(saved.id, "New Ritual"));
    expect(result.current.savedCarts[0].name).toBe("New Ritual");

    const snapshot = result.current.savedCarts[0].items[0].quantity;
    act(() => result.current.addItem({ id: "ritual", name: "Ritual", price: 50 }));
    expect(result.current.savedCarts[0].items[0].quantity).toBe(snapshot);

    act(() => result.current.deleteSavedCart(saved.id));
    expect(result.current.savedCarts).toHaveLength(0);
  });

  it("respects localStorage hydration and resilience", () => {
    const storedCart = [{ id: "stored", name: "Stored", price: 5, quantity: 2 }];
    const storedSaved = [
      {
        id: "saved-1",
        name: "Stored Ritual",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        items: storedCart,
      },
    ];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCart));
    window.localStorage.setItem(SAVED_CART_KEY, JSON.stringify(storedSaved));

    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toHaveLength(1);
    expect(result.current.savedCarts).toHaveLength(1);
  });

  it("falls back when storage is invalid", () => {
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    const { result } = renderHook(() => useCart(), { wrapper });
    expect(result.current.cartItems).toHaveLength(0);
  });
});
