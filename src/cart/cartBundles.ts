import { useCallback } from "react";
import { useCart } from "@/cart/cartStore";
import { ritualBundles, RitualBundle } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";

export function useBundleActions() {
  const { addItem } = useCart();

  const addBundleToCart = useCallback(
    (bundle: RitualBundle) => {
      bundle.products.forEach(({ productId, quantity = 1 }) => {
        const detail = PRODUCT_DETAIL_MAP[productId];
        if (!detail) return;
        addItem({
          id: productId,
          name: detail.productName,
          price: detail.priceNumber,
          quantity,
          imageUrl: detail.heroImage,
        });
      });
    },
    [addItem]
  );

  return {
    addBundleToCart,
    ritualBundles,
  };
}
