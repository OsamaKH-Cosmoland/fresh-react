export interface EmailService {
  sendLoginNotification(email: string): Promise<void>;
}

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
