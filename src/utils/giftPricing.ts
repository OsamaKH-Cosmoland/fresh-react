import { giftAddOns } from "@/content/giftBoxes";
import {
  getDefaultVariant,
  getVariantById,
  type ProductDetailContent,
} from "@/content/productDetails";

export function calculateProductTotal(
  selectedProducts: ProductDetailContent[],
  selectedVariants: Record<string, string>
) {
  return selectedProducts.reduce((sum, product) => {
    const variantId = selectedVariants[product.productId];
    const variant =
      (variantId && getVariantById(product.productId, variantId)) ??
      getDefaultVariant(product.productId);
    const price = variant?.priceNumber ?? product.priceNumber;
    return sum + price;
  }, 0);
}

export function calculateAddOnTotal(selectedAddOns: string[]) {
  return selectedAddOns.reduce((sum, addOnId) => {
    const addOn = giftAddOns.find((entry) => entry.id === addOnId);
    return sum + (addOn?.price ?? 0);
  }, 0);
}

export function calculateGiftTotal(
  boxPrice: number,
  productTotal: number,
  addOnTotal: number
) {
  return boxPrice + productTotal + addOnTotal;
}
