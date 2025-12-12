import type { AnalyticsClient } from "@/domain/analytics/AnalyticsClient";
import { ConsoleAnalyticsClient } from "../ConsoleAnalyticsClient";
import { HttpAnalyticsClient } from "../HttpAnalyticsClient";
import { InMemoryAnalyticsClient } from "../InMemoryAnalyticsClient";
import { TestLogger } from "@/infrastructure/logging";
import { getLogger, setLogger } from "@/logging/globalLogger";

type Scenario = {
  name: string;
  create: () => {
    client: AnalyticsClient;
    verify: (
      eventName: string,
      payload?: Record<string, unknown>,
      context?: { metadata?: Record<string, unknown> },
    ) => Promise<void> | void;
    cleanup?: () => void;
  };
};

const trackingName = "contract_event";
const trackingPayload = { answer: 42 };
const trackingContext = { metadata: { source: "contract" } };

const scenarios: Scenario[] = [
  {
    name: "ConsoleAnalyticsClient",
    create: () => {
      const originalLogger = getLogger();
      const testLogger = new TestLogger();
      setLogger(testLogger);
      const client = new ConsoleAnalyticsClient();
      return {
        client,
        verify: async (eventName, payload, context) => {
          const entries = testLogger.getEntries();
          expect(entries).toHaveLength(1);
          expect(entries[0]).toEqual(
            expect.objectContaining({
              level: "info",
              message: "[analytics] event tracked",
              meta: { eventName, payload, context },
              timestamp: expect.any(String),
            }),
          );
        },
        cleanup: () => {
          setLogger(originalLogger);
        },
      };
    },
  },
  {
    name: "InMemoryAnalyticsClient",
    create: () => {
      const client = new InMemoryAnalyticsClient();
      return {
        client,
        verify: async (eventName, payload, context) => {
          expect(client.getEvents()).toEqual([{ name: eventName, payload, context }]);
        },
      };
    },
  },
  {
    name: "HttpAnalyticsClient",
    create: () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: true });
      const client = new HttpAnalyticsClient("https://analytics.example.com/collect", { fetcher: fetchMock });
      return {
        client,
        verify: async (eventName, payload, context) => {
          expect(fetchMock).toHaveBeenCalledWith("https://analytics.example.com/collect", {
            method: "POST",
            headers: expect.objectContaining({ "Content-Type": "application/json" }),
            body: JSON.stringify({ events: [{ name: eventName, payload, context }] }),
          });
        },
      };
    },
  },
];

describe("AnalyticsClient contract", () => {
  describe.each(scenarios)("$name", (scenario) => {
    it("tracks an event", async () => {
      const { client, verify, cleanup } = scenario.create();
      try {
        await client.track(trackingName, trackingPayload, trackingContext);
        await verify(trackingName, trackingPayload, trackingContext);
      } finally {
        cleanup?.();
      }
    });

    it("flush resolves", async () => {
      const { client, cleanup } = scenario.create();
      try {
        await expect(client.flush()).resolves.toBeUndefined();
      } finally {
        cleanup?.();
      }
    });
  });
});
