import { createOrder } from "./ordersService";
import { FakeClock } from "../../infrastructure/time/FakeClock";
import { FakeIdGenerator } from "../../infrastructure/ids/FakeIdGenerator";
import { InMemoryOrdersRepository } from "../../infrastructure/repositories/InMemoryOrdersRepository";
import { FakeEmailProvider } from "../../infrastructure/email/fakeEmailProvider";

describe("ordersService with injected clock/id generator", () => {
  it("produces deterministic ids and timestamps when dependencies are injected", async () => {
    const clock = new FakeClock("2024-01-01T00:00:00.000Z");
    const idGenerator = new FakeIdGenerator("TEST", 1);
    const repo = new InMemoryOrdersRepository([], idGenerator, clock);
    const emailProvider = new FakeEmailProvider();

    const payload = {
      paymentMethod: "cash_on_delivery",
      customer: { name: "Injected", phone: "123" },
      totals: { items: 1, subtotal: 50, subTotal: 50, shipping: 0, currency: "EGP" },
      items: [{ id: "p1", title: "Product 1", quantity: 1, unitPrice: "50" }],
    };

    const { stored } = await createOrder(payload, repo, emailProvider, { clock, idGenerator });

    expect(stored.id).toBe("TEST-1");
    expect(stored.orderCode).toBe("TEST-2");
    expect(stored.createdAt).toBeInstanceOf(Date);
    expect((stored.createdAt as Date).toISOString()).toBe(clock.now().toISOString());
  });
});
