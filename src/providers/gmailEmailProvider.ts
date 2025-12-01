import nodemailer from "nodemailer";
import { EmailProvider } from "./emailProvider";

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

export class GmailEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = pickEnv(process.env.SMTP_HOST, process.env.EMAIL_HOST);
    const portValue = pickEnv(process.env.SMTP_PORT, process.env.EMAIL_PORT);
    const port = portValue ? Number(portValue) : 465;
    const user = pickEnv(process.env.SMTP_USER, process.env.EMAIL_USER);
    const pass = pickEnv(process.env.SMTP_PASS, process.env.EMAIL_PASS);

    if (!host || !user || !pass) {
      throw new Error("Missing SMTP configuration (SMTP_HOST/SMTP_USER/SMTP_PASS)");
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    const from =
      pickEnv(process.env.FROM_EMAIL, process.env.SMTP_USER, process.env.EMAIL_USER) ||
      "no-reply@natureskincare.local";
    const textFallback = stripHtml(body) || "Thank you for your NaturaGloss order.";

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text: textFallback,
      html: body,
    });
  }
}
