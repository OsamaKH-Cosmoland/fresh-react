import { DefaultIdGenerator } from "./DefaultIdGenerator";
import { FakeIdGenerator } from "./FakeIdGenerator";

describe("DefaultIdGenerator", () => {
  it("generates prefixed unique ids", () => {
    const gen = new DefaultIdGenerator("NG");
    const id1 = gen.nextId();
    const id2 = gen.nextId();
    expect(id1).toMatch(/^NG-/);
    expect(id2).toMatch(/^NG-/);
    expect(id1).not.toBe(id2);
  });
});

describe("FakeIdGenerator", () => {
  it("generates predictable sequential ids", () => {
    const gen = new FakeIdGenerator("TEST", 5);
    expect(gen.nextId()).toBe("TEST-5");
    expect(gen.nextId()).toBe("TEST-6");
  });
});
