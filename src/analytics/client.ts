import type { AnalyticsClient } from "@/domain/analytics/AnalyticsClient";
import { ConsoleAnalyticsClient } from "@/infrastructure/analytics/ConsoleAnalyticsClient";

let analyticsClient: AnalyticsClient = new ConsoleAnalyticsClient();

export function getAnalyticsClient(): AnalyticsClient {
  return analyticsClient;
}

export function setAnalyticsClient(client: AnalyticsClient): void {
  analyticsClient = client;
}
