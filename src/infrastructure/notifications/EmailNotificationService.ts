import nodemailer from "nodemailer";
import type { EmailService } from "../../domain/shared/EmailService";
import type { NotificationContext, NotificationService } from "../../domain/shared/NotificationService";

type Logger = Pick<Console, "warn">;

const sanitizeString = (value: unknown) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

let cachedTransporter: nodemailer.Transporter | null = null;

const resolveFromEmail = () => sanitizeString(process.env.FROM_EMAIL || process.env.SMTP_USER);

const ensureMailer = async () => {
  if (cachedTransporter) return cachedTransporter;

  const host = sanitizeString(process.env.SMTP_HOST);
  const portRaw = sanitizeString(process.env.SMTP_PORT);
  const port = portRaw ? Number(portRaw) : 587;
  const user = sanitizeString(process.env.SMTP_USER);
  const pass = sanitizeString(process.env.SMTP_PASS);

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

/**
 * Notification adapter that delegates to the existing EmailService for auth flows
 * and uses the SMTP configuration for generic notifications.
 */
export class EmailNotificationService implements NotificationService {
  constructor(
    private readonly emailService: EmailService,
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

    const transporter = await ensureMailer();
    if (!transporter) {
      throw new Error("SMTP configuration is missing; cannot send email notification.");
    }

    const from = resolveFromEmail() || target;
    const subject = sanitizeString(context?.subject) || "Notification";

    await transporter.sendMail({
      to: target,
      from,
      subject,
      text: message,
    });
  }
}
