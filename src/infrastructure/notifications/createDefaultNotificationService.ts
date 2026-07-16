import { ConsoleEmailService } from "../email/ConsoleEmailService.js";
import type { ConfigProvider } from "../../domain/config/ConfigProvider.js";
import { EnvConfigProvider } from "../config/EnvConfigProvider.js";
import type { NotificationService } from "../../domain/shared/NotificationService.js";
import { EmailNotificationService } from "./EmailNotificationService.js";
import { TelegramNotificationService } from "./TelegramNotificationService.js";
import { CompositeNotificationService } from "./CompositeNotificationService.js";

const defaultConfigProvider = new EnvConfigProvider();

export const createDefaultNotificationService = (
  configProvider: ConfigProvider = defaultConfigProvider,
  emailService = new ConsoleEmailService(),
): NotificationService => {
  const emailAdapter = new EmailNotificationService(emailService, configProvider);
  const telegramAdapter = new TelegramNotificationService(configProvider);
  return new CompositeNotificationService([emailAdapter, telegramAdapter]);
};

export const getDefaultNotificationService = (
  configProvider?: ConfigProvider,
): NotificationService => {
  return createDefaultNotificationService(
    configProvider ?? defaultConfigProvider,
  );
};
