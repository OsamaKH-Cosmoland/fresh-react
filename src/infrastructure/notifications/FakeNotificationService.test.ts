import { FakeNotificationService } from "./FakeNotificationService";

describe("FakeNotificationService", () => {
  it("records notifications for assertions", async () => {
    const service = new FakeNotificationService();

    await service.notify("user@example.com", "hello", { category: "auth" });
    await service.notify("ops", "order created");

    expect(service.calls).toHaveLength(2);
    expect(service.calls[0]).toMatchObject({
      recipient: "user@example.com",
      message: "hello",
      context: { category: "auth" },
    });

    service.reset();
    expect(service.calls).toHaveLength(0);
  });
});
