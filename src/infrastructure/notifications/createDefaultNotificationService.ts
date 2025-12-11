import { ConsoleEmailService } from "../email/ConsoleEmailService";
import type { NotificationService } from "../../domain/shared/NotificationService";
import { EmailNotificationService } from "./EmailNotificationService";
import { TelegramNotificationService } from "./TelegramNotificationService";
import { CompositeNotificationService } from "./CompositeNotificationService";

let cachedNotificationService: NotificationService | null = null;

export const createDefaultNotificationService = (): NotificationService => {
  const emailAdapter = new EmailNotificationService(new ConsoleEmailService());
  const telegramAdapter = new TelegramNotificationService();
  return new CompositeNotificationService([emailAdapter, telegramAdapter]);
};

export const getDefaultNotificationService = (): NotificationService => {
  if (!cachedNotificationService) {
    cachedNotificationService = createDefaultNotificationService();
  }
  return cachedNotificationService;
};
