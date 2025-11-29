import nodemailer from "nodemailer";
import { EmailProvider } from "./emailProvider";

export class GmailEmailProvider implements EmailProvider {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

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
    const from = process.env.FROM_EMAIL || process.env.SMTP_USER;

    await this.transporter.sendMail({
      from,
      to,
      subject,
      text: body,
    });
  }
}
