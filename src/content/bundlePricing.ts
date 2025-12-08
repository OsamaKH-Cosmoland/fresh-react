import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import type { RitualBundle } from "@/content/bundles";

export interface BundlePricingSummary {
  bundlePrice: number;
  compareAt: number;
  savingsAmount: number;
  savingsPercent: number;
}

export function getBundlePricing(bundle: RitualBundle): BundlePricingSummary {
  const compareAt = bundle.products.reduce((sum, entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    if (!detail) return sum;
    const quantity = entry.quantity ?? 1;
    return sum + detail.priceNumber * quantity;
  }, 0);

  const bundlePrice = bundle.bundlePriceNumber;
  const savingsAmount = Math.max(0, compareAt - bundlePrice);
  const normalizedCompareAt = Math.max(compareAt, bundlePrice);
  const savingsPercent = normalizedCompareAt > 0 ? Math.round((savingsAmount / normalizedCompareAt) * 100) : 0;

  return {
    bundlePrice,
    compareAt: normalizedCompareAt,
    savingsAmount,
    savingsPercent,
  };
}
