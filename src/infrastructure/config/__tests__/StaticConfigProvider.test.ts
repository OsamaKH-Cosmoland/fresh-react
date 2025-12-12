import { StaticConfigProvider } from "../StaticConfigProvider";

describe("StaticConfigProvider", () => {
  it("returns values and parses numbers/booleans", () => {
    const provider = new StaticConfigProvider({
      values: {
        FOO: "bar",
        COUNT: "5",
        ENABLED: "true",
        DISABLED: "0",
      },
      objects: {
        PAYLOAD: { nested: "value" },
      },
    });

    expect(provider.get("foo")).toBe("bar");
    expect(provider.getNumber("count")).toBe(5);
    expect(provider.getBoolean("enabled")).toBe(true);
    expect(provider.getBoolean("disabled")).toBe(false);
    expect(provider.getObject("payload")).toEqual({ nested: "value" });
  });
});
