import { InMemoryAnalyticsClient } from "../InMemoryAnalyticsClient";

describe("InMemoryAnalyticsClient", () => {
  it("collects tracked events", async () => {
    const client = new InMemoryAnalyticsClient();
    await client.track("foo", { answer: 42 }, { metadata: { mode: "test" } });
    await client.track("bar");

    expect(client.getEvents()).toEqual([
      {
        name: "foo",
        payload: { answer: 42 },
        context: { metadata: { mode: "test" } },
      },
      {
        name: "bar",
        payload: undefined,
        context: undefined,
      },
    ]);
  });

  it("can clear stored events", async () => {
    const client = new InMemoryAnalyticsClient();
    await client.track("foo");
    client.clear();
    expect(client.getEvents()).toEqual([]);
  });
});
