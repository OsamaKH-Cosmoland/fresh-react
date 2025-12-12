import { ConsoleEmailService } from "../email/ConsoleEmailService";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import type { FeatureFlagProvider } from "@/domain/config/FeatureFlagProvider";
import { SimpleFeatureFlagProvider } from "@/infrastructure/config/SimpleFeatureFlagProvider";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";
import type { NotificationService } from "../../domain/shared/NotificationService";
import { EmailNotificationService } from "./EmailNotificationService";
import { TelegramNotificationService } from "./TelegramNotificationService";
import { CompositeNotificationService } from "./CompositeNotificationService";

const defaultConfigProvider = new EnvConfigProvider();
const defaultFeatureFlagProvider = new SimpleFeatureFlagProvider(defaultConfigProvider);

export const createDefaultNotificationService = (
  configProvider: ConfigProvider = defaultConfigProvider,
  featureFlagProvider: FeatureFlagProvider = defaultFeatureFlagProvider,
  emailService = new ConsoleEmailService(),
): NotificationService => {
  const emailAdapter = new EmailNotificationService(emailService, configProvider);
  const telegramAdapter = new TelegramNotificationService(configProvider);
  return new CompositeNotificationService([emailAdapter, telegramAdapter]);
};

export const getDefaultNotificationService = (
  configProvider?: ConfigProvider,
  featureFlagProvider?: FeatureFlagProvider,
): NotificationService => {
  return createDefaultNotificationService(
    configProvider ?? defaultConfigProvider,
    featureFlagProvider ?? defaultFeatureFlagProvider,
  );
};
