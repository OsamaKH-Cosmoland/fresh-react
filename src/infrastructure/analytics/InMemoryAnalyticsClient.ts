import type {
  AnalyticsClient,
  AnalyticsContext,
  AnalyticsEventPayload,
  AnalyticsEventRecord,
} from "@/domain/analytics/AnalyticsClient";

export class InMemoryAnalyticsClient implements AnalyticsClient {
  private readonly events: AnalyticsEventRecord[] = [];

  async track(eventName: string, payload?: AnalyticsEventPayload, context?: AnalyticsContext): Promise<void> {
    this.events.push({ name: eventName, payload, context });
  }

  async flush(): Promise<void> {
    // No batching; nothing to flush.
  }

  getEvents(): AnalyticsEventRecord[] {
    return [...this.events];
  }

  clear(): void {
    this.events.length = 0;
  }
}
