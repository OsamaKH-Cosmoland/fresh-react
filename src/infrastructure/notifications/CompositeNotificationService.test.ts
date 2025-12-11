import type { NotificationService } from "../../domain/shared/NotificationService";
import { CompositeNotificationService } from "./CompositeNotificationService";

describe("CompositeNotificationService", () => {
  it("invokes all channels", async () => {
    const a: NotificationService = { notify: jest.fn().mockResolvedValue(undefined) };
    const b: NotificationService = { notify: jest.fn().mockResolvedValue(undefined) };
    const composite = new CompositeNotificationService([a, b]);

    await composite.notify("user@example.com", "hello", { category: "auth" });

    expect((a.notify as jest.Mock)).toHaveBeenCalledTimes(1);
    expect((b.notify as jest.Mock)).toHaveBeenCalledTimes(1);
  });

  it("logs errors when a channel fails but does not throw if another succeeds", async () => {
    const failing: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("down")) };
    const succeeding: NotificationService = { notify: jest.fn().mockResolvedValue(undefined) };
    const logger = { error: jest.fn(), warn: jest.fn() } as any;
    const composite = new CompositeNotificationService([failing, succeeding], logger);

    await expect(composite.notify("ops", "message")).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalled();
  });

  it("throws when all channels fail", async () => {
    const failingA: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("a")) };
    const failingB: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("b")) };
    const logger = { error: jest.fn(), warn: jest.fn() } as any;
    const composite = new CompositeNotificationService([failingA, failingB], logger);

    await expect(composite.notify("ops", "message")).rejects.toThrow(/All notification channels failed/);
    expect(logger.error).toHaveBeenCalled();
  });
});
