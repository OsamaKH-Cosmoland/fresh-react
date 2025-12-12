export type AnalyticsEventPayload = Record<string, unknown>;

export type AnalyticsContext = {
  metadata?: Record<string, unknown>;
};

export type AnalyticsEventRecord = {
  name: string;
  payload?: AnalyticsEventPayload;
  context?: AnalyticsContext;
};

export interface AnalyticsClient {
  track(eventName: string, payload?: AnalyticsEventPayload, context?: AnalyticsContext): Promise<void>;
  flush(): Promise<void>;
}
