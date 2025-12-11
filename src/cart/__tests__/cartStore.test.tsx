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
  createInitialState,
} from "@/cart/cartStore";
import { GIFT_CREDIT_KEY } from "@/utils/giftCreditStorage";

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

  it("returns state for unknown actions", () => {
    const untouched = cartReducer(baseState, { type: "unknown" } as CartAction);
    expect(untouched).toBe(baseState);
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

  it("merges quantities, updates totals, and removes down to empty", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "dup", name: "Dup", price: 20, quantity: 2 }));
    act(() => result.current.addItem({ id: "dup", name: "Dup", price: 20, quantity: 1 }));
    expect(result.current.totalQuantity).toBe(3);
    expect(result.current.subtotal).toBe(60);

    act(() => result.current.updateQuantity("dup", 1));
    expect(result.current.totalQuantity).toBe(1);
    expect(result.current.subtotal).toBe(20);

    act(() => result.current.removeItem("dup"));
    expect(result.current.cartItems).toHaveLength(0);
    expect(result.current.totalQuantity).toBe(0);

    act(() => result.current.addItem({ id: "another", name: "Another", price: 5, quantity: 1 }));
    act(() => result.current.clearCart());
    expect(result.current.cartItems).toHaveLength(0);
  });

  it("persists cart and saved carts to localStorage", () => {
    const setItemSpy = jest.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => result.current.addItem({ id: "persist", name: "Persist", price: 30, quantity: 1 }));
    act(() => result.current.saveCurrentCart("Persisted Cart"));

    const storageKeys = setItemSpy.mock.calls.map((call) => call[0]);
    expect(storageKeys).toContain(STORAGE_KEY);
    expect(storageKeys).toContain(SAVED_CART_KEY);
    setItemSpy.mockRestore();
  });

  it("handles saved carts lifecycle and branchy paths", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "line", name: "Line", price: 10, quantity: 1 }));

    expect(result.current.saveCustomCart("", [])).toBe(false);
    expect(result.current.saveCustomCart(" ", [{ id: "x", name: "X", price: 5, quantity: 1 }])).toBe(false);

    act(() => {
      expect(result.current.loadSavedCart("missing")).toBe(false);
    });

    act(() => result.current.saveCustomCart("Custom", [{ id: "x", name: "X", price: 5, quantity: 1 }]));
    const savedId = result.current.savedCarts[0].id;
    act(() => {
      expect(result.current.loadSavedCart(savedId)).toBe(true);
    });
    expect(result.current.activeSavedCartId).toBe(savedId);

    act(() => {
      expect(result.current.renameSavedCart(savedId, "Renamed Cart")).toBe(true);
    });
    expect(result.current.savedCarts[0].name).toBe("Renamed Cart");
    expect(result.current.renameSavedCart("missing", "Nope")).toBe(false);

    act(() => {
      expect(result.current.deleteSavedCart(savedId)).toBe(true);
    });
    expect(result.current.activeSavedCartId).toBeNull();
    expect(result.current.deleteSavedCart("missing")).toBe(false);
  });

  it("applies and clears promo codes with eligibility checks", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "low", name: "Low", price: 100, quantity: 1, productId: "body-balm" }));

    expect(result.current.applyPromoCode("  ").status).toBe("invalid");
    expect(result.current.applyPromoCode("UNKNOWN").status).toBe("invalid");
    expect(result.current.applyPromoCode("WELCOME10").status).toBe("not_applicable");

    act(() =>
      result.current.addItem({ id: "high", name: "High", price: 400, quantity: 1, productId: "body-balm" })
    );
    act(() => {
      const applied = result.current.applyPromoCode("WELCOME10");
      expect(applied.status).toBe("applied");
    });
    expect(result.current.discountTotal).toBe(50);
    expect(result.current.appliedPromo?.code).toBe("WELCOME10");

    act(() => result.current.clearPromoCode());
    expect(result.current.appliedPromo).toBeNull();
  });

  it("handles gift credit application across status branches", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() => result.current.addItem({ id: "line", name: "Line", price: 300, quantity: 1 }));

    expect(result.current.applyGiftCredit("   ").status).toBe("invalid");

    window.localStorage.setItem(GIFT_CREDIT_KEY, JSON.stringify([]));
    expect(result.current.applyGiftCredit("MISSING").status).toBe("not_found");

    const buildCredit = (overrides: Partial<{
      code: string;
      status: string;
      remainingAmountBase: number;
      initialAmountBase: number;
    }>) => ({
      id: `credit-${overrides.code ?? "c1"}`,
      code: overrides.code ?? "CREDIT",
      initialAmountBase: overrides.initialAmountBase ?? 100,
      remainingAmountBase: overrides.remainingAmountBase ?? 100,
      status: (overrides.status as "active" | "inactive" | "exhausted") ?? "active",
      source: "manual_adjustment",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    window.localStorage.setItem(GIFT_CREDIT_KEY, JSON.stringify([buildCredit({ code: "INACTIVE", status: "inactive" })]));
    expect(result.current.applyGiftCredit("INACTIVE").status).toBe("invalid");

    window.localStorage.setItem(GIFT_CREDIT_KEY, JSON.stringify([buildCredit({ code: "EMPTY", remainingAmountBase: 0 })]));
    expect(result.current.applyGiftCredit("EMPTY").status).toBe("exhausted");

    window.localStorage.setItem(
      GIFT_CREDIT_KEY,
      JSON.stringify([buildCredit({ code: "GIFT", remainingAmountBase: 50, initialAmountBase: 50 })])
    );
    act(() => {
      const applied = result.current.applyGiftCredit("GIFT");
      expect(applied.status).toBe("ok");
    });
    expect(result.current.giftCreditCode).toBe("GIFT");
    expect(result.current.giftCreditAppliedAmountBase).toBe(50);

    act(() => result.current.clearGiftCredit());
    expect(result.current.giftCreditCode).toBeNull();

    window.localStorage.setItem(
      GIFT_CREDIT_KEY,
      JSON.stringify([buildCredit({ code: "OVERRIDE", remainingAmountBase: 5, initialAmountBase: 5 })])
    );
    act(() => {
      const overrideResult = result.current.applyGiftCredit("OVERRIDE", 3);
      expect(overrideResult.status).toBe("ok");
      expect(overrideResult.appliedAmountBase).toBe(3);
    });
  });

  it("replaces cart via setCart and resets promos", () => {
    const { result } = renderHook(() => useCart(), { wrapper });
    act(() =>
      result.current.addItem({ id: "promo", name: "Promo", price: 500, quantity: 1, productId: "body-balm" })
    );
    act(() => result.current.applyPromoCode("WELCOME10"));
    expect(result.current.appliedPromo).not.toBeNull();

    act(() => result.current.setCart([{ id: "new", name: "New", price: 20, quantity: 1 }]));
    expect(result.current.cartItems[0].id).toBe("new");
    expect(result.current.appliedPromo).toBeNull();

    act(() => result.current.clearPromoCode());
    expect(result.current.appliedPromo).toBeNull();
  });
});

describe("createInitialState hydration", () => {
  const sampleStoredItems: CartItem[] = [
    { id: "stored-1", name: "Stored", price: 200, quantity: 2, productId: "body-balm" },
  ];

  afterEach(() => {
    jest.restoreAllMocks();
    window.localStorage.clear();
  });

  it("hydrates from saved storage and re-applies promos", () => {
    const payload = {
      items: sampleStoredItems,
      activePromoCode: "WELCOME10",
      appliedPromo: null,
      giftCreditCode: "GIFT50",
      giftCreditAppliedAmountBase: 25,
    };
    const saved: SavedCart = {
      id: "saved-1",
      name: "Saved",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      items: sampleStoredItems,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    window.localStorage.setItem(SAVED_CART_KEY, JSON.stringify([saved]));

    const state = createInitialState();
    expect(state.items[0].quantity).toBe(2);
    expect(state.activePromoCode).toBe("WELCOME10");
    expect(state.appliedPromo?.discountAmount).toBe(40);
    expect(state.giftCreditCode).toBe("GIFT50");
    expect(state.savedCarts).toHaveLength(1);
  });

  it("falls back gracefully on malformed storage", () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    window.localStorage.setItem(STORAGE_KEY, "not-json");
    const state = createInitialState();
    expect(state.items).toEqual([]);
    expect(errorSpy).toHaveBeenCalled();
  });

  it("drops stored promo when evaluation fails", () => {
    const payload = {
      items: [{ id: "tiny", name: "Tiny", price: 10, quantity: 1, productId: "body-balm" }],
      activePromoCode: "WELCOME10",
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    const state = createInitialState();
    expect(state.activePromoCode).toBeNull();
    expect(state.appliedPromo).toBeNull();
  });
});

describe("useCart hook enforcement", () => {
  it("throws outside provider", () => {
    expect(() => renderHook(() => useCart())).toThrow("useCart must be used within a CartProvider");
  });
});
