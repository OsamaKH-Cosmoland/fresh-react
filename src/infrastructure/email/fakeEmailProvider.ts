import { EmailProvider } from "../../domain/shared/EmailProvider.js";

export class FakeEmailProvider implements EmailProvider {
  sentEmails: { to: string; subject: string; body: string }[] = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }
}
