import { InMemoryOrdersRepository } from "./InMemoryOrdersRepository";
import { makeTestOrder, runOrdersRepositoryContract } from "@/domain/orders/testing/ordersRepository.contract";

runOrdersRepositoryContract({
  name: "InMemoryOrdersRepository",
  create: () => new InMemoryOrdersRepository(),
});

describe("InMemoryOrdersRepository specifics", () => {
  it("creates orders with generated ids and returns snapshots", async () => {
    const repo = new InMemoryOrdersRepository();
    const stored = await repo.create(makeTestOrder({ id: "" }));

    expect(stored.id).toMatch(/^NG-/);
    expect(repo.snapshot()[0].id).toBe(stored.id);
  });
});
