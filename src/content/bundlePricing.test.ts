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

  it("keeps the configured Ultimate Bundle price for the default weights", () => {
    const bundle = ritualBundles.find((entry) => entry.id === "ultimate-bundle");
    expect(bundle).toBeDefined();
    if (!bundle) return;

    const summary = getBundlePricing(bundle, {
      "hair-shine-anti-frizz-oil": "hair-shine-50ml",
      "hair-growth-oil": "hair-growth-50ml",
      "body-balm": "body-balm-50ml",
      "hand-balm": "hand-balm-50ml",
    });

    expect(summary.bundlePrice).toBe(649);
  });

  it("recalculates the Ultimate Bundle price when selected weights change", () => {
    const bundle = ritualBundles.find((entry) => entry.id === "ultimate-bundle");
    expect(bundle).toBeDefined();
    if (!bundle) return;

    const summary = getBundlePricing(bundle, {
      "hair-shine-anti-frizz-oil": "hair-shine-30ml",
      "hair-growth-oil": "hair-growth-30ml",
      "body-balm": "body-balm-30ml",
      "hand-balm": "hand-balm-30ml",
    });

    expect(summary.compareAt).toBe(861);
    expect(summary.bundlePrice).toBe(430.5);
    expect(summary.savingsAmount).toBe(430.5);
    expect(summary.savingsPercent).toBe(50);
  });
});
