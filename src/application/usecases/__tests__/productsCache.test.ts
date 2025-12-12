import { InMemoryCache } from "@/infrastructure/cache/InMemoryCache";
import { TestCache } from "@/infrastructure/cache/TestCache";
import { listProducts } from "../products";

describe("listProducts cache integration", () => {
  const sampleDocs = [
    { _id: { toString: () => "1" }, name: "One", price: 10 },
    { _id: { toString: () => "2" }, name: "Two", price: 20 },
  ];

  let findMock: jest.Mock;
  let sortMock: jest.Mock;
  let toArrayMock: jest.Mock;
  let collectionFactory: jest.Mock;
  let dbFactory: jest.Mock;

  beforeEach(() => {
    toArrayMock = jest.fn().mockResolvedValue(sampleDocs);
    sortMock = jest.fn(() => ({ toArray: toArrayMock }));
    findMock = jest.fn(() => ({ sort: sortMock }));
    collectionFactory = jest.fn(() => ({ find: findMock }));

    dbFactory = jest.fn().mockResolvedValue({
      db: { collection: collectionFactory },
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("uses cache on subsequent calls", async () => {
    const cache = new TestCache();
    const first = await listProducts({ cache, dbFactory });
    expect(first).toEqual([
      { _id: "1", name: "One", price: 10 },
      { _id: "2", name: "Two", price: 20 },
    ]);
    expect(findMock).toHaveBeenCalledTimes(1);

    const second = await listProducts({ cache, dbFactory });
    expect(second).toEqual(first);
    expect(findMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to DB after ttl expires", async () => {
    const cache = new InMemoryCache();
    let now = 1_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);

    try {
      const options = { cache, cacheTtlMs: 50, dbFactory };
      await listProducts(options);
      expect(findMock).toHaveBeenCalledTimes(1);

      now += 40;
      await listProducts(options);
      expect(findMock).toHaveBeenCalledTimes(1);

      now += 20;
      await listProducts(options);
      expect(findMock).toHaveBeenCalledTimes(2);
    } finally {
      (Date.now as jest.Mock).mockRestore();
    }
  });
});
