import { ConsoleEmailService } from "../email/ConsoleEmailService";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";
import type { NotificationService } from "../../domain/shared/NotificationService";
import { EmailNotificationService } from "./EmailNotificationService";
import { TelegramNotificationService } from "./TelegramNotificationService";
import { CompositeNotificationService } from "./CompositeNotificationService";

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
