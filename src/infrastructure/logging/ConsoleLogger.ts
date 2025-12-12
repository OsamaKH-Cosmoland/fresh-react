import type { Logger, LogMetadata } from "@/domain/logging/Logger";

const formatMessage = (level: string, message: string) => {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
};

const logWithMeta = (fn: (...args: unknown[]) => void, message: string, meta?: LogMetadata) => {
  if (meta && Object.keys(meta).length > 0) {
    fn(message, meta);
  } else {
    fn(message);
  }
};

export class ConsoleLogger implements Logger {
  debug(message: string, meta?: LogMetadata): void {
    logWithMeta(console.debug, formatMessage("debug", message), meta);
  }

  info(message: string, meta?: LogMetadata): void {
    logWithMeta(console.info, formatMessage("info", message), meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    logWithMeta(console.warn, formatMessage("warn", message), meta);
  }

  error(message: string, meta?: LogMetadata): void {
    logWithMeta(console.error, formatMessage("error", message), meta);
  }
}
