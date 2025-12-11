import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";

export type NotificationCall = {
  recipient: string;
  message: string;
  context?: NotificationContext;
};

/**
 * In-memory notification service used by tests to assert notification calls.
 */
export class FakeNotificationService implements NotificationService {
  public readonly calls: NotificationCall[] = [];

  async notify(recipient: string, message: string, context?: NotificationContext): Promise<void> {
    this.calls.push({ recipient, message, context });
  }

  reset() {
    this.calls.length = 0;
  }
}
