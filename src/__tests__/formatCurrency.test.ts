import { formatCurrency } from "@/utils/formatCurrency";

describe("formatCurrency", () => {
  it("formats positive numbers with trailing decimals", () => {
    const formatted = formatCurrency(123.45);
    expect(formatted).toContain("EGP");
    expect(formatted).toMatch(/123\.45$/);
  });

  it("formats zero as EGP 0.00", () => {
    const formatted = formatCurrency(0);
    expect(formatted).toMatch(/0\.00$/);
  });

  it("handles non-finite numbers", () => {
    expect(formatCurrency(Number.POSITIVE_INFINITY)).toBe("EGP 0.00");
    expect(formatCurrency(Number.NaN)).toBe("EGP 0.00");
  });
});
