import type {
  AnalyticsClient,
  AnalyticsContext,
  AnalyticsEventPayload,
} from "@/domain/analytics/AnalyticsClient";
import { getLogger } from "@/logging/globalLogger";

export class ConsoleAnalyticsClient implements AnalyticsClient {
  async track(eventName: string, payload?: AnalyticsEventPayload, context?: AnalyticsContext): Promise<void> {
    getLogger().info("[analytics] event tracked", { eventName, payload, context });
  }

  async flush(): Promise<void> {
    // No-op for console logging.
  }
}
