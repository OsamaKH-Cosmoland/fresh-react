import { jest } from "@jest/globals";
import type { LocalOrder } from "@/types/localOrder";

const mockedReadOrders = jest.fn();

await jest.unstable_mockModule("@/utils/orderStorage", () => ({
  readOrders: mockedReadOrders,
}));

const { isTargetVerifiedForAnyOrder } = await import("@/utils/reviewVerification");

const baseOrder = {
  id: "order-1",
  createdAt: "2024-01-01T00:00:00.000Z",
  items: [
    {
      id: "item-1",
      productId: "body-balm",
      name: "Body Balm",
      price: 200,
      quantity: 1,
      bundleItems: [
        {
          productId: "calm-glow-body-soap",
          name: "Calm Soap",
          price: 200,
          quantity: 1,
        },
      ],
      giftBox: {
        styleName: "classic-kraft",
        items: [
          { productId: "hand-balm", name: "Hand Balm", price: 180, quantity: 1 },
        ],
        boxPrice: 120,
        addonsPrice: 0,
      },
    },
  ],
  totals: {
    subtotal: 500,
    shippingCost: 20,
    total: 520,
    currency: "EGP",
  },
  customer: { name: "Test", email: "test@example.com" },
  shippingAddress: {
    country: "EG",
    city: "Cairo",
    street: "Street",
    postalCode: "12345",
  },
  shippingMethod: {
    id: "ship-1",
    label: "Express",
    description: "Fast",
    eta: "1 day",
    cost: 20,
  },
  paymentSummary: {
    methodLabel: "Card",
    status: "paid",
  },
} satisfies LocalOrder;

describe("reviewVerification", () => {
  it("confirms verification for product, bundle, and gift box matches", () => {
    mockedReadOrders.mockReturnValue([baseOrder]);
    expect(isTargetVerifiedForAnyOrder("body-balm", "product")).toBe(true);
    expect(isTargetVerifiedForAnyOrder("calm-glow-body-soap", "product")).toBe(true);
    expect(isTargetVerifiedForAnyOrder("hand-balm", "product")).toBe(true);
    expect(isTargetVerifiedForAnyOrder("non-existent", "product")).toBe(false);
    expect(isTargetVerifiedForAnyOrder("order-1", "bundle")).toBe(false);
  });

  it("handles bundle targets correctly", () => {
    mockedReadOrders.mockReturnValue([
      {
        ...baseOrder,
        items: [
          {
            ...baseOrder.items[0],
            bundleId: "evening-calm-ritual",
          },
        ],
      },
    ]);
    expect(isTargetVerifiedForAnyOrder("evening-calm-ritual", "bundle")).toBe(true);
  });
});
