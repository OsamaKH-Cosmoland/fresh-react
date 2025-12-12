import nodemailer from "nodemailer";
import type { ConfigProvider } from "@/domain/config/ConfigProvider";
import { EnvConfigProvider } from "@/infrastructure/config/EnvConfigProvider";
import { EmailProvider } from "../../domain/shared/EmailProvider";

const stripHtml = (value: string): string => {
  const plain = value.replace(/<\/?[^>]+(>|$)/g, " ");
  return plain.replace(/\s+/g, " ").trim();
};

const pickFromProvider = (provider: ConfigProvider, keys: string[], fallback?: string): string => {
  for (const key of keys) {
    const value = provider.get(key);
    if (value) return value;
  }
  return fallback ?? "";
};

export class GmailEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly configProvider: ConfigProvider = new EnvConfigProvider()) {
    const host = pickFromProvider(this.configProvider, ["SMTP_HOST", "EMAIL_HOST"]);
    const portValue = pickFromProvider(this.configProvider, ["SMTP_PORT", "EMAIL_PORT"]);
    const port = portValue ? Number(portValue) : 465;
    const user = pickFromProvider(this.configProvider, ["SMTP_USER", "EMAIL_USER"]);
    const pass = pickFromProvider(this.configProvider, ["SMTP_PASS", "EMAIL_PASS"]);

    if (!host || !user || !pass || Number.isNaN(port)) {
      throw new Error("Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    }

    const explicitSecure = this.configProvider.getBoolean("SMTP_SECURE") ?? this.configProvider.getBoolean("EMAIL_SECURE");
    const secure = explicitSecure ?? port === 465;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const userAddress = pickFromProvider(this.configProvider, [
      "SMTP_USER",
      "EMAIL_USER",
      "FROM_EMAIL",
      "EMAIL_FROM_ADDRESS",
    ]);
    const displayName = pickFromProvider(this.configProvider, ["EMAIL_FROM_NAME"]) || "NaturaGloss";
    const replyTo = pickFromProvider(this.configProvider, ["EMAIL_FROM_ADDRESS", "FROM_EMAIL"]);
    const fromAddress = userAddress || "no-reply@natureskincare.local";
    const from = `${displayName} <${fromAddress}>`;
    const textFallback = stripHtml(body) || "Thank you for your NaturaGloss order.";

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text: textFallback,
      html: body,
      replyTo: replyTo || undefined,
    });
  }
}
