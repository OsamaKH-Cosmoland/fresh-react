import {
  addCartItem,
  clearCart,
  readCart,
  removeCartItem,
  writeCart,
} from "@/utils/cartStorage";
import type { Product } from "@/types/product";

const sampleProduct = {
  _id: "prod-1",
  id: "prod-1",
  name: "Test product",
  price: 110,
} satisfies Product & { id: string };

describe("cartStorage helpers", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty array when storage is empty or malformed", () => {
    expect(readCart()).toEqual([]);
    window.localStorage.setItem("naturagloss-cart", "not-json");
    expect(readCart()).toEqual([]);
  });

  it("writes and reads cart items successfully", () => {
    writeCart([{ id: "prod-1", name: "Written", price: 50, quantity: 2 }]);
    expect(readCart()).toHaveLength(1);
    expect(window.localStorage.getItem("naturagloss-cart")).toContain("Written");
  });

  it("adds a new item or increments existing quantity", () => {
    const first = addCartItem([], sampleProduct);
    expect(first).toHaveLength(1);
    expect(first[0].quantity).toBe(1);

    const incremented = addCartItem(first, sampleProduct);
    expect(incremented[0].quantity).toBe(2);
  });

  it("removes an item when quantity reaches zero and decrements properly", () => {
    const initial = [{ ...sampleProduct, quantity: 2 }];
    const afterRemove = removeCartItem(initial, sampleProduct);
    expect(afterRemove[0].quantity).toBe(1);
    const emptied = removeCartItem(afterRemove, sampleProduct);
    expect(emptied).toHaveLength(0);
  });

  it("clearCart always returns an empty array", () => {
    expect(clearCart()).toEqual([]);
  });
});
