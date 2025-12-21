import { useCallback } from "react";
import { useCart } from "@/cart/cartStore";
import { ritualBundles, RitualBundle } from "@/content/bundles";
import {
  PRODUCT_DETAIL_MAP,
  getDefaultVariant,
  getVariantById,
  getLocalizedProductName,
  getLocalizedProductVariants,
} from "@/content/productDetails";
import { getBundlePricing } from "@/content/bundlePricing";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { useTranslation } from "@/localization/locale";

export function useBundleActions() {
  const { addItem } = useCart();
  const { locale } = useTranslation();

  const addBundleToCart = useCallback(
    (bundle: RitualBundle, variantSelection?: Record<string, string>) => {
      const pricing = getBundlePricing(bundle);
      const bundleName = locale === "ar" ? bundle.nameAr ?? bundle.name : bundle.name;
      const bundleItems = bundle.products.map((entry) => {
        const detail = PRODUCT_DETAIL_MAP[entry.productId];
        const defaultVariantId =
          variantSelection?.[entry.productId] ??
          entry.variantId ??
          getDefaultVariant(entry.productId)?.variantId;
        const variant =
          (defaultVariantId && getVariantById(entry.productId, defaultVariantId)) ??
          getDefaultVariant(entry.productId);
        const localizedVariant = variant
          ? getLocalizedProductVariants(entry.productId, locale).find(
              (entryVariant) => entryVariant.variantId === variant.variantId
            )
          : undefined;
        return {
          productId: entry.productId,
          name: getLocalizedProductName(entry.productId, locale),
          quantity: entry.quantity ?? 1,
          variantId: variant?.variantId,
          variantLabel: localizedVariant?.label ?? variant?.label,
          variantAttributes: localizedVariant?.attributes ?? variant?.attributes,
        };
      });

      addItem({
        id: `bundle-${bundle.id}`,
        name: bundleName,
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
    [addItem, locale]
  );

  return {
    addBundleToCart,
    ritualBundles,
  };
}
