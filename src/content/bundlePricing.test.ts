import { ritualBundles } from "@/content/bundles";
import { getBundlePricing } from "@/content/bundlePricing";

describe("bundle pricing", () => {
  it("uses explicit savings, compare-at, and percent for the Glow & Grow bundle", () => {
    const bundle = ritualBundles.find((entry) => entry.id === "hair-strength-ritual");
    expect(bundle).toBeDefined();
    if (!bundle) return;

    const summary = getBundlePricing(bundle);
    expect(summary.bundlePrice).toBe(bundle.bundlePriceNumber);
    expect(summary.savingsAmount).toBeGreaterThan(0);
    expect(summary.compareAt).toBeGreaterThan(summary.bundlePrice);
    expect(summary.savingsPercent).toBeGreaterThanOrEqual(0);
    expect(summary.savingsPercent).toBeGreaterThanOrEqual(1);
    expect(summary.compareAt).toBe(585);
    expect(summary.savingsAmount).toBe(236);
    expect(summary.savingsPercent).toBe(40);
  });
});
