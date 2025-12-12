import type { EmailService } from "../../domain/shared/EmailService";
import { getLogger } from "@/logging/globalLogger";

/** Console-backed email service used by the demo login handler. */
export class ConsoleEmailService implements EmailService {
  private readonly sentEmails: string[] = [];

  async sendLoginNotification(email: string): Promise<void> {
    this.sentEmails.push(email);
    getLogger().info("[email] login notification sent", { email });
  }

  getSentEmails(): string[] {
    return [...this.sentEmails];
  }
}
