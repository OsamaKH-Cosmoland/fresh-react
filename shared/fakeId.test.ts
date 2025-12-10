import { createFakeIdGenerator } from "./fakeId";

describe("createFakeIdGenerator", () => {
  it("increments deterministically", () => {
    const gen = createFakeIdGenerator("ORD");
    expect(gen()).toBe("ORD-1");
    expect(gen()).toBe("ORD-2");
    expect(gen()).toBe("ORD-3");
  });

  it("creates independent generators", () => {
    const first = createFakeIdGenerator("A", 5);
    const second = createFakeIdGenerator("B", 1);
    expect(first()).toBe("A-5");
    expect(second()).toBe("B-1");
    expect(first()).toBe("A-6");
    expect(second()).toBe("B-2");
  });
});
