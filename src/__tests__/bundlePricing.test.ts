import { ritualBundles } from "@/content/bundles";
import { getBundlePricing } from "@/content/bundlePricing";

describe("bundle pricing", () => {
  it("calculates savings, compare-at, and percent for a known bundle", () => {
    const bundle = ritualBundles.find((entry) => entry.id === "evening-calm-ritual");
    expect(bundle).toBeDefined();
    if (!bundle) return;

    const summary = getBundlePricing(bundle);
    expect(summary.bundlePrice).toBe(bundle.bundlePriceNumber);
    expect(summary.savingsAmount).toBeGreaterThan(0);
    expect(summary.compareAt).toBeGreaterThan(summary.bundlePrice);
    expect(summary.savingsPercent).toBeGreaterThanOrEqual(0);
    expect(summary.savingsPercent).toBeGreaterThanOrEqual(1);
    expect(summary.compareAt).toBeCloseTo(622.97, 2);
    expect(summary.savingsAmount).toBeCloseTo(52.98, 2);
  });
});
