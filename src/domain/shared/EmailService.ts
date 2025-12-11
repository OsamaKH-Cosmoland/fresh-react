/** Notification abstraction for sending user-facing emails. */
export interface EmailService {
  sendLoginNotification(email: string): Promise<void>;
}
