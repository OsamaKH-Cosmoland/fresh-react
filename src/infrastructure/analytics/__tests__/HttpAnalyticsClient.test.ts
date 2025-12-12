import { HttpAnalyticsClient } from "../HttpAnalyticsClient";

describe("HttpAnalyticsClient", () => {
  it("sends events to the configured endpoint", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    const client = new HttpAnalyticsClient("https://analytics.example.com/collect", { fetcher: fetchMock });

    await client.track("event_1", { value: 10 }, { metadata: { channel: "contract" } });

    expect(fetchMock).toHaveBeenCalledWith("https://analytics.example.com/collect", {
      method: "POST",
      headers: expect.objectContaining({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        events: [
          {
            name: "event_1",
            payload: { value: 10 },
            context: { metadata: { channel: "contract" } },
          },
        ],
      }),
    });
  });

  it("flush resolves when queue is empty", async () => {
    const client = new HttpAnalyticsClient("https://analytics.example.com/collect", {
      fetcher: jest.fn().mockResolvedValue({ ok: true }),
    });
    await expect(client.flush()).resolves.toBeUndefined();
  });
});
