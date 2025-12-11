import { SystemClock } from "./SystemClock";
import { FakeClock } from "./FakeClock";

describe("SystemClock", () => {
  it("returns the current time", () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();
    const after = Date.now();
    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after + 5);
  });
});

describe("FakeClock", () => {
  it("returns a fixed time and can advance", () => {
    const start = "2024-01-01T00:00:00.000Z";
    const clock = new FakeClock(start);
    expect(clock.now().toISOString()).toBe(start);
    clock.advanceSeconds(30);
    expect(clock.now().toISOString()).toBe("2024-01-01T00:00:30.000Z");
    clock.advanceMs(7000);
    expect(clock.now().toISOString()).toBe("2024-01-01T00:00:37.000Z");
    clock.set("2024-02-01T12:00:00.000Z");
    expect(clock.now().toISOString()).toBe("2024-02-01T12:00:00.000Z");
  });
});
