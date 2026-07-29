import * as Sentry from "@sentry/node";
import type { Logger, LogMetadata } from "../../domain/logging/Logger.js";

/**
 * Decorates another Logger so that every `error(...)` call is also reported to
 * Sentry. All log levels are still forwarded to the wrapped logger unchanged,
 * so existing console output is preserved. Only `error` produces a Sentry event.
 *
 * This is how "anything, anytime" gets covered: the whole app already funnels
 * failures through `getLogger().error(...)` (order flow, notifications,
 * repositories, config, etc.), so wrapping the global logger captures them all
 * without touching every call site.
 */
export class SentryLogger implements Logger {
  constructor(private readonly inner: Logger) {}

  debug(message: string, meta?: LogMetadata): void {
    this.inner.debug(message, meta);
  }

  info(message: string, meta?: LogMetadata): void {
    this.inner.info(message, meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    this.inner.warn(message, meta);
  }

  error(message: string, meta?: LogMetadata): void {
    this.inner.error(message, meta);
    this.reportToSentry(message, meta);
  }

  private reportToSentry(message: string, meta?: LogMetadata): void {
    try {
      const extra: Record<string, unknown> = { logMessage: message, ...(meta ?? {}) };
      const candidate = meta?.["error"];

      if (candidate instanceof Error) {
        // The common case: `getLogger().error("...", { error: e })`.
        Sentry.captureException(candidate, { extra });
      } else if (candidate !== undefined && candidate !== null) {
        // A non-Error value was thrown/logged; keep the log message as context.
        Sentry.captureException(new Error(message), {
          extra: { ...extra, originalError: candidate },
        });
      } else {
        // No error object attached — record the message itself at error level.
        Sentry.captureMessage(message, { level: "error", extra });
      }
    } catch {
      // Telemetry must never break the app.
    }
  }
}
