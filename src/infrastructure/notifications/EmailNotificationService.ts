import nodemailer from "nodemailer";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";
import type { EmailService } from "../../domain/shared/EmailService";
import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";

type Logger = Pick<Console, "warn">;

const sanitizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

const ensureMailer = async (configProvider: ConfigProvider) => {
  if (cachedTransporter) return cachedTransporter;

  const host = sanitizeString(configProvider.get("SMTP_HOST"));
  const portRaw = sanitizeString(configProvider.get("SMTP_PORT"));
  const port = portRaw ? Number(portRaw) : 587;
  const user = sanitizeString(configProvider.get("SMTP_USER"));
  const pass = sanitizeString(configProvider.get("SMTP_PASS"));

  if (!host || !port) {
    return null;
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
  return cachedTransporter;
};

let cachedTransporter: nodemailer.Transporter | null = null;

/**
 * Notification adapter that delegates to the existing EmailService for auth flows
 * and uses the SMTP configuration for generic notifications.
 */
export class EmailNotificationService implements NotificationService {
  constructor(
    private readonly emailService: EmailService,
    private readonly configProvider: ConfigProvider = new EnvConfigProvider(),
    private readonly logger: Logger = console
  ) {}

  private isAuthCategory(context?: NotificationContext) {
    const category = sanitizeString(context?.category).toLowerCase();
    const hint = sanitizeString(Array.isArray(context?.channelHint) ? context?.channelHint[0] : context?.channelHint);
    return category.startsWith("auth") || category === "login" || hint === "login";
  }

  async notify(recipient: string, message: string, context?: NotificationContext): Promise<void> {
    const explicitRecipient = context?.recipients?.email;
    const target = explicitRecipient !== undefined ? sanitizeString(explicitRecipient) : sanitizeString(recipient);
    if (!target) {
      this.logger.warn("[email] missing recipient for notification; skipping");
      return;
    }

    if (this.isAuthCategory(context)) {
      await this.emailService.sendLoginNotification(target);
      return;
    }

    const transporter = await ensureMailer(this.configProvider);
    if (!transporter) {
      throw new Error("SMTP configuration is missing; cannot send email notification.");
    }

    const from = sanitizeString(this.configProvider.get("FROM_EMAIL") || this.configProvider.get("SMTP_USER")) || target;
    const subject = sanitizeString(context?.subject) || "Notification";

    await transporter.sendMail({
      to: target,
      from,
      subject,
      text: message,
    });
  }
}
