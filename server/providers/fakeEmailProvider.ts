import { EmailProvider } from "./emailProvider";

export class FakeEmailProvider implements EmailProvider {
  sentEmails: { to: string; subject: string; body: string }[] = [];

  async send(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({ to, subject, body });
  }
}
