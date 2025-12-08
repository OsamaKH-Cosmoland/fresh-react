import { cartReducer, type CartState } from "@/cart/cartStore";

const baseState: CartState = {
  items: [],
  savedCarts: [],
  activeSavedCartId: null,
  updatedAt: 0,
};

describe("cartReducer", () => {
  it("adds a new item with normalized quantity and increments existing entries", () => {
    const afterAdd = cartReducer(baseState, {
      type: "add",
      payload: { id: "item-1", name: "Item One", price: 10, quantity: 0 },
    });

    expect(afterAdd.items).toHaveLength(1);
    expect(afterAdd.items[0].quantity).toBe(1);
    expect(afterAdd.items[0].price).toBe(10);
    expect(afterAdd.updatedAt).toBeGreaterThanOrEqual(baseState.updatedAt);

    const nextState = cartReducer(afterAdd, {
      type: "add",
      payload: { id: "item-1", name: "Item One", price: 10, quantity: 1 },
    });

    expect(nextState.items[0].quantity).toBe(2);
  });

  it("updates quantity and removes items when quantity is zero", () => {
    const stateWithItem: CartState = {
      ...baseState,
      items: [{ id: "item-2", name: "Item Two", price: 5, quantity: 2 }],
    };

    const updated = cartReducer(stateWithItem, {
      type: "update",
      payload: { id: "item-2", quantity: 1 },
    });
    expect(updated.items[0].quantity).toBe(1);

    const removed = cartReducer(updated, {
      type: "update",
      payload: { id: "item-2", quantity: 0 },
    });
    expect(removed.items).toHaveLength(0);
  });

  it("resets items when clear action runs", () => {
    const populated: CartState = {
      ...baseState,
      items: [{ id: "item-3", name: "Item Three", price: 8, quantity: 1 }],
    };
    const cleared = cartReducer(populated, { type: "clear" });
    expect(cleared.items).toHaveLength(0);
  });

  it("stores and loads saved carts", () => {
    const savedCart = {
      id: "saved-1",
      name: "Routine",
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
      items: [{ id: "item-4", name: "Item Four", price: 12, quantity: 1 }],
    };
    const withSaved = cartReducer(baseState, { type: "set-saved", payload: [savedCart] });
    expect(withSaved.savedCarts).toContainEqual(savedCart);

    const loaded = cartReducer(withSaved, {
      type: "load-saved",
      payload: { items: savedCart.items, activeSavedCartId: savedCart.id },
    });
    expect(loaded.items).toEqual(savedCart.items);
  });
});
