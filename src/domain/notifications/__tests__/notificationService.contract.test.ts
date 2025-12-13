import type { NotificationService } from "@/domain/shared/NotificationService";
import { makeTestNotification, runNotificationServiceContract } from "@/domain/notifications/testing/notificationService.contract";
import { FakeNotificationService } from "@/infrastructure/notifications/FakeNotificationService";
import { CompositeNotificationService } from "@/infrastructure/notifications/CompositeNotificationService";
import { ConsoleNotificationService } from "@/infrastructure/notifications/ConsoleNotificationService";
import { NullLogger } from "@/infrastructure/logging/NullLogger";

const createSilentComposite = () => {
  const logger = { error: jest.fn(), warn: jest.fn() };
  return new CompositeNotificationService([new FakeNotificationService()], logger);
};

const implementations = [
  { name: "FakeNotificationService", factory: () => new FakeNotificationService() },
  {
    name: "ConsoleNotificationService",
    factory: () => new ConsoleNotificationService(new NullLogger()),
  },
  { name: "CompositeNotificationService", factory: () => createSilentComposite() },
];

describe("NotificationService contract suite", () => {
  for (const impl of implementations) {
    runNotificationServiceContract(impl.name, impl.factory);
  }
});

describe("CompositeNotificationService behavior", () => {
  it("dispatches to each child service", async () => {
    const primary = new FakeNotificationService();
    const secondary = new FakeNotificationService();
    const logger = { error: jest.fn(), warn: jest.fn() };
    const composite = new CompositeNotificationService([primary, secondary], logger);
    const payload = makeTestNotification();

    await composite.notify(payload.recipient, payload.message, payload.context);

    expect(primary.calls).toHaveLength(1);
    expect(secondary.calls).toHaveLength(1);
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("surfaces an aggregate error when every channel fails", async () => {
    const failingA: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("a")) };
    const failingB: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("b")) };
    const logger = { error: jest.fn(), warn: jest.fn() };
    const composite = new CompositeNotificationService([failingA, failingB], logger);
    const payload = makeTestNotification();

    await expect(composite.notify(payload.recipient, payload.message, payload.context)).rejects.toThrow(
      /All notification channels failed/
    );
    expect(logger.error).toHaveBeenCalledTimes(2);
  });

  it("continues when at least one channel succeeds", async () => {
    const failing: NotificationService = { notify: jest.fn().mockRejectedValue(new Error("boom")) };
    const succeeding = new FakeNotificationService();
    const logger = { error: jest.fn(), warn: jest.fn() };
    const composite = new CompositeNotificationService([failing, succeeding], logger);
    const payload = makeTestNotification();

    await expect(composite.notify(payload.recipient, payload.message, payload.context)).resolves.toBeUndefined();
    expect(succeeding.calls).toHaveLength(1);
    expect(logger.error).toHaveBeenCalledTimes(1);
  });
});
