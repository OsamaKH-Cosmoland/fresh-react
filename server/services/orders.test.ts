import { describe, expect, it } from "vitest";
import { InMemoryOrdersRepository } from "../repositories/InMemoryOrdersRepository";
import { createOrder } from "./orders";
import { FakeEmailProvider } from "../providers/fakeEmailProvider";

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
    const emailProvider = new FakeEmailProvider();
    const result = await createOrder(buildPayload(), repo, emailProvider);
    expect(result.clean.id).toBeTruthy();
    const all = await repo.list(10);
    expect(all.length).toBe(1);
    expect(emailProvider.sentEmails).toHaveLength(1);
    expect(emailProvider.sentEmails[0]).toMatchObject({
      to: "test@example.com",
      subject: "Order Confirmation",
    });
    expect(emailProvider.sentEmails[0].body).toContain(result.stored.id);
  });

  it("blocks duplicate recent cash orders by phone", async () => {
    const repo = new InMemoryOrdersRepository();
    const emailProvider = new FakeEmailProvider();
    await createOrder(buildPayload(), repo, emailProvider);
    await expect(createOrder(buildPayload(), repo, emailProvider)).rejects.toMatchObject({
      statusCode: 409,
    });
  });
});
