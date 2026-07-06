import { submitOrderToApi } from "@/utils/orderApi";
import type { LocalOrder } from "@/types/localOrder";

const createOrder = (): LocalOrder => ({
  id: "order-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  items: [
    {
      id: "cart-1",
      productId: "product-1",
      name: "Body Balm",
      price: 120,
      quantity: 2,
      variantLabel: "Standard",
    },
  ],
  totals: {
    subtotal: 240,
    discountTotal: 0,
    shippingCost: 40,
    total: 280,
    currency: "EGP",
  },
  customer: {
    name: "Test Customer",
    email: "test@example.com",
    phone: "01000000000",
  },
  shippingAddress: {
    country: "Egypt",
    city: "Cairo",
    street: "Test Street",
    postalCode: "",
  },
  shippingMethod: {
    id: "standard",
    label: "Standard Delivery",
    description: "Delivery",
    eta: "2 days",
    cost: 40,
  },
  paymentSummary: {
    methodLabel: "Cash on delivery",
    status: "simulated",
  },
});

describe("submitOrderToApi", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("posts orders to the Telegram-backed orders endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, orderId: "order-1", orderCode: "NG-ABC123" }),
    });

    const result = await submitOrderToApi(createOrder());

    expect(result).toEqual({ ok: true, orderId: "order-1", orderCode: "NG-ABC123" });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/orders",
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining('"id":"order-1"'),
      })
    );
  });

  it("returns a failure result when the server rejects the order", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Missing Telegram config",
    });

    const result = await submitOrderToApi(createOrder());

    expect(result).toEqual({
      ok: false,
      status: 500,
      error: "Missing Telegram config",
    });
  });
});
