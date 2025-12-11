export type NotificationContext = {
  /** Hint about which channel(s) this notification targets (e.g. email, telegram). */
  channelHint?: string | string[];
  /** Category of the notification such as auth, order, etc. */
  category?: string;
  /** Subject or title for channels that support it (email). */
  subject?: string;
  /** Optional order metadata to help downstream formatters. */
  orderId?: string;
  orderCode?: string;
  /** Channel-specific recipient overrides, keyed by channel name. */
  recipients?: Record<string, string>;
  /** Arbitrary metadata for providers. */
  metadata?: Record<string, unknown>;
};

export interface NotificationService {
  notify(recipient: string, message: string, context?: NotificationContext): Promise<void>;
}
