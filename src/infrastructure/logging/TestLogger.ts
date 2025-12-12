import type { Logger, LogMetadata } from "@/domain/logging/Logger";

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  level: LogLevel;
  message: string;
  meta?: LogMetadata;
  timestamp: string;
};

export class TestLogger implements Logger {
  private readonly entries: LogEntry[] = [];

  debug(message: string, meta?: LogMetadata): void {
    this.record("debug", message, meta);
  }

  info(message: string, meta?: LogMetadata): void {
    this.record("info", message, meta);
  }

  warn(message: string, meta?: LogMetadata): void {
    this.record("warn", message, meta);
  }

  error(message: string, meta?: LogMetadata): void {
    this.record("error", message, meta);
  }

  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  clear(): void {
    this.entries.length = 0;
  }

  private record(level: LogLevel, message: string, meta?: LogMetadata) {
    this.entries.push({
      level,
      message,
      meta,
      timestamp: new Date().toISOString(),
    });
  }
}
