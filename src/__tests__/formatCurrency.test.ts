import { formatCurrency } from "@/utils/formatCurrency";

describe("formatCurrency", () => {
  it("formats positive numbers with trailing decimals", () => {
    const formatted = formatCurrency(123.45);
    expect(formatted).toBe("E£ 123.45");
  });

  it("formats zero as EGP 0.00", () => {
    const formatted = formatCurrency(0);
    expect(formatted).toBe("E£ 0.00");
  });

  it("handles non-finite numbers", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("E£ 0.00");
    expect(formatCurrency(Number.NaN)).toBe("E£ 0.00");
  });
});
