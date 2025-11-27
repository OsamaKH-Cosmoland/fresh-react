import { describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "../repositories/InMemoryOrdersRepository";
import { createOrder } from "./orders";

const buildPayload = (overrides: any = {}) => ({
  paymentMethod: "cash_on_delivery",
  status: "pending",
  totals: { items: 1, subtotal: 100, subTotal: 100, shipping: 0, currency: "EGP" },
  customer: {
    name: "Test User",
    email: "test@example.com",
    phone: "+201000000000",
    address: "123 St",
    city: "Cairo",
    notes: "",
  },
  items: [
    {
      id: "prod-1",
      title: "Sample Item",
      quantity: 1,
      unitPrice: "100",
      variant: { name: "std", label: "std", size: "std", price: 100, currency: "EGP" },
    },
  ],
  ...overrides,
});

describe("createOrder service", () => {
  it("creates an order with the repository", async () => {
    const repo = new InMemoryOrdersRepository();
    const result = await createOrder(buildPayload(), repo);
    expect(result.clean.id).toBeTruthy();
    const all = await repo.list(10);
    expect(all.length).toBe(1);
  });

  it("blocks duplicate recent cash orders by phone", async () => {
    const repo = new InMemoryOrdersRepository();
    await createOrder(buildPayload(), repo);
    await expect(createOrder(buildPayload(), repo)).rejects.toMatchObject({ statusCode: 409 });
  });
});
