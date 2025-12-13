import type { NotificationContext, NotificationService } from "@/domain/shared/NotificationService";

type NotificationPayload = {
  recipient: string;
  message: string;
  context?: NotificationContext;
};

const createDefaultNotificationContext = (): NotificationContext => ({
  channelHint: ["contract"],
  category: "contract",
  metadata: { source: "contract" },
});

export const makeTestNotification = (overrides: Partial<NotificationPayload> = {}): NotificationPayload => ({
  recipient: overrides.recipient ?? "user@example.com",
  message: overrides.message ?? "Test notification message",
  context: overrides.context ?? createDefaultNotificationContext(),
});

export const runNotificationServiceContract = (
  name: string,
  factory: () => NotificationService,
  options?: { supportsBatch?: boolean }
) => {
  describe(`${name} NotificationService contract`, () => {
    it("resolves valid notification payloads", async () => {
      const service = factory();
      const payload = makeTestNotification();
      await expect(service.notify(payload.recipient, payload.message, payload.context)).resolves.toBeUndefined();
    });

    it("returns a Promise so callers can await the result", async () => {
      const service = factory();
      const payload = makeTestNotification();
      const promise = service.notify(payload.recipient, payload.message, payload.context);
      expect(promise).toBeInstanceOf(Promise);
      await promise;
    });

    it("accepts undefined context without throwing", async () => {
      const service = factory();
      await expect(service.notify("contextless@example.com", "no context", undefined)).resolves.toBeUndefined();
    });

    it("supports consecutive notifications without leaking state", async () => {
      const service = factory();
      const payload = makeTestNotification();
      await service.notify(payload.recipient, payload.message, payload.context);
      await expect(service.notify(payload.recipient, `${payload.message} again`, payload.context)).resolves.toBeUndefined();
    });

    if (options?.supportsBatch) {
      it("exposes a flush hook for batched transports", async () => {
        const service = factory();
        const flush = (service as NotificationService & { flush?: () => Promise<void> }).flush;
        if (!flush) {
          throw new Error("Expected batch-capable service to expose a flush method");
        }
        await flush();
      });
    }
  });
};
