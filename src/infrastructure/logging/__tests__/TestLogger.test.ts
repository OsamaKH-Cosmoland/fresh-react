import { TestLogger } from "../TestLogger";

describe("TestLogger", () => {
  it("records entries with metadata and timestamp", () => {
    const logger = new TestLogger();
    logger.info("event happened", { id: 1 });

    const entries = logger.getEntries();
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      level: "info",
      message: "event happened",
      meta: { id: 1 },
    });
    expect(typeof entries[0].timestamp).toBe("string");
  });

  it("can clear stored entries", () => {
    const logger = new TestLogger();
    logger.warn("first");
    logger.clear();
    expect(logger.getEntries()).toEqual([]);
  });
});
