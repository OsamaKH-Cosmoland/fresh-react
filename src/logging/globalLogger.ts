import type { Logger } from "@/domain/logging/Logger";
import { ConsoleLogger } from "@/infrastructure/logging/ConsoleLogger";

let activeLogger: Logger = new ConsoleLogger();
let isConfigured = false;

export function getLogger(): Logger {
  return activeLogger;
}

export function setLogger(logger: Logger): void {
  activeLogger = logger;
  isConfigured = true;
}

export function configureLogger(logger: Logger): void {
  if (isConfigured) return;
  activeLogger = logger;
  isConfigured = true;
}
