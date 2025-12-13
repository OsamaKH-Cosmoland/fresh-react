import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";
import type { Logger } from "@/domain/logging/Logger";
import { getLogger } from "@/logging/globalLogger";

const defaultLogger = getLogger();

/**
 * Simple NotificationService implementation that logs notification payloads.
 */
export class ConsoleNotificationService implements NotificationService {
  constructor(private readonly logger: Logger = defaultLogger) {}

  async notify(recipient: string, message: string, context?: NotificationContext): Promise<void> {
    this.logger.info("[notification] console", { recipient: recipient || "n/a", message, context });
  }
}
