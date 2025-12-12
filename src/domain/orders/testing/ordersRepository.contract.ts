import type { OrdersRepository } from "@/infrastructure/repositories/OrdersRepository";
import type { Order } from "@/domain/shared/Order";

export const makeTestOrder = (overrides: Partial<Order> = {}): Order => {
  const createdAt = overrides.createdAt ?? new Date().toISOString();
  const phone = overrides.customer?.phone ?? "+201000000000";
  return {
    id: overrides.id ?? "order-1",
    paymentMethod: overrides.paymentMethod ?? "cash_on_delivery",
    status: overrides.status ?? "pending",
    totals:
      overrides.totals ?? {
        items: 1,
        subtotal: 100,
        shipping: 0,
        currency: "EGP",
      },
    customer:
      overrides.customer ?? {
        name: "Test",
        email: "test@example.com",
        phone,
        address: "123 St",
        city: "Cairo",
        notes: "",
      },
    items: overrides.items ?? [],
    createdAt,
    updatedAt: overrides.updatedAt,
    ...overrides,
  };
};

type RepositoryFactory = {
  name: string;
  create: () => OrdersRepository | Promise<OrdersRepository>;
  cleanup?: (repo: OrdersRepository) => void | Promise<void>;
};

export function runOrdersRepositoryContract(factory: RepositoryFactory) {
  describe(`${factory.name} OrdersRepository contract`, () => {
    let repo: OrdersRepository;

    beforeEach(async () => {
      repo = await factory.create();
    });

    afterEach(async () => {
      await factory.cleanup?.(repo);
    });

    it("creates an order (autogenerates id when missing) and lists it", async () => {
      const stored = await repo.create(makeTestOrder({ id: "" }));
      expect(stored.id).toBeTruthy();

      const listed = await repo.list(10);
      expect(listed.find((order) => order.id === stored.id)).toBeTruthy();
    });

    it("updates status and persists the change", async () => {
      const created = await repo.create(makeTestOrder({ id: "to-update", status: "pending" }));

      const updated = await repo.updateStatus(created.id, "completed");
      expect(updated?.status).toBe("completed");
      expect(updated?.updatedAt).toBeTruthy();

      const listed = await repo.list(5);
      const found = listed.find((order) => order.id === created.id);
      expect(found?.status).toBe("completed");
    });

    it("returns null when updating a missing id", async () => {
      await repo.create(makeTestOrder({ id: "existing" }));

      const result = await repo.updateStatus("missing", "completed");
      expect(result).toBeNull();
    });

    it("lists orders sorted by createdAt descending and respects limits", async () => {
      await repo.create(makeTestOrder({ id: "old", createdAt: "2023-01-01T00:00:00.000Z" }));
      await repo.create(makeTestOrder({ id: "new", createdAt: "2024-01-01T00:00:00.000Z" }));

      const listed = await repo.list(1);
      expect(listed).toHaveLength(1);
      expect(listed[0].id).toBe("new");
    });

    it("finds recent cash-on-delivery orders by phone and date threshold", async () => {
      await repo.create(makeTestOrder({ id: "cash", createdAt: "2024-02-01T00:00:00.000Z" }));
      await repo.create(
        makeTestOrder({
          id: "stale",
          createdAt: "2023-01-01T00:00:00.000Z",
        })
      );
      await repo.create(
        makeTestOrder({
          id: "card",
          paymentMethod: "card",
          createdAt: "2024-02-02T00:00:00.000Z",
        })
      );

      const found = await repo.findRecentCashOrderByPhone("+201000000000", "2024-01-15");
      const none = await repo.findRecentCashOrderByPhone("+201000000000", "2024-03-01");

      expect(found?.id).toBe("cash");
      expect(none).toBeNull();
    });
  });
}
