import { getDefaultVariant, getVariantById, PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import type { RitualBundle } from "@/content/bundles";

export interface BundlePricingSummary {
  bundlePrice: number;
  compareAt: number;
  savingsAmount: number;
  savingsPercent: number;
}

export function getBundlePricing(bundle: RitualBundle): BundlePricingSummary {
  const calculatedCompareAt = bundle.products.reduce((sum, entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    if (!detail) return sum;
    const quantity = entry.quantity ?? 1;
    const variant = getVariantById(entry.productId, entry.variantId) ?? getDefaultVariant(entry.productId);
    const compareAtPrice = variant?.compareAtPrice ?? detail.compareAtPrice ?? variant?.priceNumber ?? detail.priceNumber;
    return sum + compareAtPrice * quantity;
  }, 0);

  const bundlePrice = bundle.price ?? bundle.bundlePriceNumber;
  const compareAt = bundle.compareAtPrice ?? calculatedCompareAt;
  const savingsAmount = Math.max(0, compareAt - bundlePrice);
  const normalizedCompareAt = Math.max(compareAt, bundlePrice);
  const savingsPercent =
    bundle.discountPercentage ??
    (normalizedCompareAt > 0 ? Math.round((savingsAmount / normalizedCompareAt) * 100) : 0);

  return {
    bundlePrice,
    compareAt: normalizedCompareAt,
    savingsAmount,
    savingsPercent,
  };
}
