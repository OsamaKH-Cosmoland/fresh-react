import { useCallback } from "react";
import { useCart } from "@/cart/cartStore";
import { ritualBundles, RitualBundle } from "@/content/bundles";
import {
  PRODUCT_DETAIL_MAP,
  getDefaultVariant,
  getVariantById,
} from "@/content/productDetails";
import { getBundlePricing } from "@/content/bundlePricing";
import { getBundleHeroImage } from "@/content/bundleHeroImages";

export function useBundleActions() {
  const { addItem } = useCart();

  const addBundleToCart = useCallback(
    (bundle: RitualBundle, variantSelection?: Record<string, string>) => {
      const pricing = getBundlePricing(bundle);
      const bundleItems = bundle.products.map((entry) => {
        const detail = PRODUCT_DETAIL_MAP[entry.productId];
        const defaultVariantId =
          variantSelection?.[entry.productId] ??
          entry.variantId ??
          getDefaultVariant(entry.productId)?.variantId;
        const variant =
          (defaultVariantId && getVariantById(entry.productId, defaultVariantId)) ??
          getDefaultVariant(entry.productId);
        return {
          productId: entry.productId,
          name: detail?.productName ?? entry.productId,
          quantity: entry.quantity ?? 1,
          variantId: variant?.variantId,
          variantLabel: variant?.label,
          variantAttributes: variant?.attributes,
        };
      });

      addItem({
        id: `bundle-${bundle.id}`,
        name: bundle.name,
        price: pricing.bundlePrice,
        quantity: 1,
        imageUrl: getBundleHeroImage(bundle.id),
        bundleId: bundle.id,
        bundleItems,
        bundleCompareAt: pricing.compareAt,
        bundleSavings: pricing.savingsAmount,
        bundleSavingsPercent: pricing.savingsPercent,
      });
    },
    [addItem]
  );

  return {
    addBundleToCart,
    ritualBundles,
  };
}
