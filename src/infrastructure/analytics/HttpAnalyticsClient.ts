import type {
  AnalyticsClient,
  AnalyticsContext,
  AnalyticsEventPayload,
  AnalyticsEventRecord,
} from "@/domain/analytics/AnalyticsClient";
import { getLogger } from "@/logging/globalLogger";

export type HttpAnalyticsClientOptions = {
  fetcher?: typeof fetch;
  extraHeaders?: Record<string, string>;
};

export class HttpAnalyticsClient implements AnalyticsClient {
  private readonly endpoint: string;
  private readonly fetcher?: typeof fetch;
  private readonly headers: Record<string, string>;
  private readonly queue: AnalyticsEventRecord[] = [];

  constructor(endpoint: string, options?: HttpAnalyticsClientOptions) {
    if (!endpoint) {
      throw new Error("HttpAnalyticsClient requires an endpoint");
    }
    this.endpoint = endpoint;
    this.fetcher = options?.fetcher;
    this.headers = {
      "Content-Type": "application/json",
      ...(options?.extraHeaders ?? {}),
    };
  }

  async track(eventName: string, payload?: AnalyticsEventPayload, context?: AnalyticsContext): Promise<void> {
    this.queue.push({ name: eventName, payload, context });
    await this.flush();
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }
    const events = this.queue.splice(0, this.queue.length);
    try {
      const fetcher = this.fetcher ?? globalThis.fetch;
      if (!fetcher) {
        throw new Error("Fetch is not available in this environment");
      }
      await fetcher(this.endpoint, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ events }),
      });
    } catch (error) {
      getLogger().error("[analytics] http send failed", { error });
    }
  }
}
