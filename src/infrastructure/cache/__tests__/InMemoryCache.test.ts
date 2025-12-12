import { InMemoryCache } from "../InMemoryCache";

describe("InMemoryCache", () => {
  let now = 0;

  beforeEach(() => {
    jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    (Date.now as jest.Mock).mockRestore();
  });

  it("stores and retrieves values", () => {
    const cache = new InMemoryCache();
    cache.set("foo", 123);
    expect(cache.get("foo")).toBe(123);
  });

  it("deletes entries", () => {
    const cache = new InMemoryCache();
    cache.set("foo", "bar");
    cache.delete("foo");
    expect(cache.get("foo")).toBeUndefined();
  });

  it("clears the store", () => {
    const cache = new InMemoryCache();
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBeUndefined();
  });

  it("expires entries after ttl", () => {
    const cache = new InMemoryCache();
    now = 1_000;
    cache.set("key", "value", 50);
    now = 1_020;
    expect(cache.get("key")).toBe("value");
    now = 1_051;
    expect(cache.get("key")).toBeUndefined();
  });
});
