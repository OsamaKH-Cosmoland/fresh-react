import nodemailer from "nodemailer";

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

export class FakeEmailProvider implements EmailProvider {
  sentEmails: { to: string; subject: string; body: string }[] = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }
}

const stripHtml = (value: string): string => {
  const plain = value.replace(/<\/?[^>]+(>|$)/g, " ");
  return plain.replace(/\s+/g, " ").trim();
};

const pickEnv = (...candidates: Array<string | undefined>) => {
  for (const candidate of candidates) {
    const cleaned = candidate?.trim();
    if (cleaned) return cleaned;
  }
  return "";
};

const parseBoolean = (value?: string) => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes") return true;
  if (normalized === "false" || normalized === "0" || normalized === "no") return false;
  return null;
};

export class GmailEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = pickEnv(process.env.SMTP_HOST, process.env.EMAIL_HOST);
    const portValue = pickEnv(process.env.SMTP_PORT, process.env.EMAIL_PORT);
    const port = portValue ? Number(portValue) : 465;
    const user = pickEnv(process.env.SMTP_USER, process.env.EMAIL_USER);
    const pass = pickEnv(process.env.SMTP_PASS, process.env.EMAIL_PASS);

    if (!host || !user || !pass || Number.isNaN(port)) {
      throw new Error("Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    }

    const explicitSecure = parseBoolean(process.env.SMTP_SECURE ?? process.env.EMAIL_SECURE);
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
    const userAddress = pickEnv(
      process.env.SMTP_USER,
      process.env.EMAIL_USER,
      process.env.FROM_EMAIL,
      process.env.EMAIL_FROM_ADDRESS
    );
    const displayName = pickEnv(process.env.EMAIL_FROM_NAME, "NaturaGloss");
    const replyTo = pickEnv(process.env.EMAIL_FROM_ADDRESS, process.env.FROM_EMAIL);
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
