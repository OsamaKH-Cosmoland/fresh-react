import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";

type Logger = Pick<Console, "error" | "warn">;

/**
 * Dispatches notifications to multiple channels while isolating failures.
 */
export class CompositeNotificationService implements NotificationService {
  constructor(
    private readonly services: NotificationService[],
    private readonly logger: Logger = console
  ) {}

  async notify(recipient: string, message: string, context?: NotificationContext): Promise<void> {
    const errors: Error[] = [];

    for (const service of this.services) {
      try {
        await service.notify(recipient, message, context);
      } catch (error: any) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push(err);
        this.logger.error("[notification] channel failed", err);
      }
    }

    if (errors.length === this.services.length && errors.length > 0) {
      const summary = errors.map((err) => err.message).join("; ");
      const aggregate = new Error(`All notification channels failed: ${summary}`);
      (aggregate as any).cause = errors;
      throw aggregate;
    }
  }
}
