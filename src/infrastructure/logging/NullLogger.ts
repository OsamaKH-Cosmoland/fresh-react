import type { Logger } from "../../domain/logging/Logger.js";

export class NullLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}
