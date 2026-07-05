import { getDefaultVariant, getVariantById, PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import type { RitualBundle } from "@/content/bundles";

export interface BundlePricingSummary {
  bundlePrice: number;
  compareAt: number;
  savingsAmount: number;
  savingsPercent: number;
}

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const getEntryVariant = (
  productId: string,
  selectedVariantId?: string,
  bundleVariantId?: string
) => {
  const variantId = selectedVariantId ?? bundleVariantId;
  return (variantId && getVariantById(productId, variantId)) ?? getDefaultVariant(productId);
};

const getBundleProductsTotal = (
  bundle: RitualBundle,
  variantSelection?: Record<string, string>,
  priceType: "price" | "compareAt" = "compareAt"
) =>
  bundle.products.reduce((sum, entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    if (!detail) return sum;
    const quantity = entry.quantity ?? 1;
    const variant = getEntryVariant(
      entry.productId,
      variantSelection?.[entry.productId],
      entry.variantId
    );
    const price =
      priceType === "compareAt"
        ? variant?.compareAtPrice ?? detail.compareAtPrice ?? variant?.priceNumber ?? detail.priceNumber
        : variant?.priceNumber ?? detail.priceNumber;
    return sum + price * quantity;
  }, 0);

const isDefaultSelection = (bundle: RitualBundle, variantSelection?: Record<string, string>) => {
  if (!variantSelection) return true;
  return bundle.products.every((entry) => {
    const defaultVariantId = entry.variantId ?? getDefaultVariant(entry.productId)?.variantId;
    return !variantSelection[entry.productId] || variantSelection[entry.productId] === defaultVariantId;
  });
};

export function getBundlePricing(
  bundle: RitualBundle,
  variantSelection?: Record<string, string>
): BundlePricingSummary {
  const calculatedCompareAt = getBundleProductsTotal(bundle, variantSelection, "price");
  const hasCustomSelection = Boolean(variantSelection) && !isDefaultSelection(bundle, variantSelection);
  const baseBundlePrice = bundle.price ?? bundle.bundlePriceNumber;
  const bundlePrice =
    hasCustomSelection && bundle.discountPercentage
      ? roundCurrency(calculatedCompareAt * (1 - bundle.discountPercentage / 100))
      : baseBundlePrice;
  const compareAt = hasCustomSelection
    ? calculatedCompareAt
    : bundle.compareAtPrice ?? getBundleProductsTotal(bundle, undefined, "compareAt");
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
