import { InMemoryOrdersRepository } from "./InMemoryOrdersRepository";
import type { Order } from "../../domain/shared/Order";

const makeOrder = (overrides: Partial<Order> = {}): Order => {
  const phone = overrides.customer?.phone ?? "+201000000000";
  return {
    id: overrides.id ?? "order-1",
    paymentMethod: overrides.paymentMethod ?? "cash_on_delivery",
    status: overrides.status ?? "pending",
    totals: overrides.totals ?? { items: 1, subtotal: 100, shipping: 0, currency: "EGP" },
    customer: overrides.customer ?? {
      name: "Test",
      email: "test@example.com",
      phone,
      address: "123 St",
      city: "Cairo",
      notes: "",
    },
    items: overrides.items ?? [],
    createdAt: overrides.createdAt ?? "2024-01-01T00:00:00.000Z",
    updatedAt: overrides.updatedAt,
  };
};

describe("InMemoryOrdersRepository", () => {
  it("creates orders with generated ids and returns snapshots", async () => {
    const repo = new InMemoryOrdersRepository();
    const stored = await repo.create(makeOrder({ id: "" }));

    expect(stored.id).toMatch(/^NG-/);
    expect(repo.snapshot()[0].id).toBe(stored.id);
  });

  it("sorts by createdAt descending and respects limits", async () => {
    const older = makeOrder({ id: "old", createdAt: "2024-01-01T00:00:00.000Z" });
    const newer = makeOrder({ id: "new", createdAt: "2024-02-01T00:00:00.000Z" });
    const repo = new InMemoryOrdersRepository([older, newer]);

    const listed = await repo.list(1);

    expect(listed).toHaveLength(1);
    expect(listed[0].id).toBe("new");
  });

  it("finds recent cash orders by phone and ignores stale or non-cash entries", async () => {
    const baseline = makeOrder({ id: "cash", createdAt: "2024-02-01T00:00:00.000Z" });
    const stale = makeOrder({ id: "stale", createdAt: "2023-01-01T00:00:00.000Z" });
    const card = makeOrder({
      id: "card",
      paymentMethod: "card",
      createdAt: "2024-02-02T00:00:00.000Z",
    });
    const repo = new InMemoryOrdersRepository([baseline, stale, card]);

    const found = await repo.findRecentCashOrderByPhone("+201000000000", "2024-01-15");
    const none = await repo.findRecentCashOrderByPhone("+201000000000", "2024-03-01");

    expect(found?.id).toBe("cash");
    expect(none).toBeNull();
  });

  it("updates status with timestamps and returns null when id is missing", async () => {
    const repo = new InMemoryOrdersRepository([makeOrder({ id: "to-update" })]);

    const updated = await repo.updateStatus("to-update", "completed");
    const missing = await repo.updateStatus("missing", "completed");

    expect(updated?.status).toBe("completed");
    expect(updated?.updatedAt).toBeTruthy();
    expect(missing).toBeNull();
  });
});
