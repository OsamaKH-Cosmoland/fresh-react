import type { EmailService } from "../../domain/shared/EmailService";

/** Console-backed email service used by the demo login handler. */
export class ConsoleEmailService implements EmailService {
  private readonly sentEmails: string[] = [];

  async sendLoginNotification(email: string): Promise<void> {
    this.sentEmails.push(email);
    console.log(`[email] login notification sent to ${email}`);
  }

  getSentEmails(): string[] {
    return [...this.sentEmails];
  }
}
