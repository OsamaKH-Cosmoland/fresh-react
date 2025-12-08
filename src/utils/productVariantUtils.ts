import type { ProductDetailContent } from "@/content/productDetails";
import { getDefaultVariant, getVariantById } from "@/content/productDetails";

export interface ProductCartData {
  productId: string;
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  variantId?: string;
  variantLabel?: string;
  variantAttributes?: Record<string, string>;
}

export function resolveProductVariant(detail: ProductDetailContent, variantId?: string) {
  return variantId ? getVariantById(detail.productId, variantId) : getDefaultVariant(detail.productId);
}

export function buildProductCartPayload(detail: ProductDetailContent, variantId?: string): ProductCartData {
  const variant = resolveProductVariant(detail, variantId);
  return {
    productId: detail.productId,
    id: variant?.variantId ?? detail.productId,
    name: detail.productName,
    price: variant?.priceNumber ?? detail.priceNumber,
    imageUrl: detail.heroImage,
    variantId: variant?.variantId,
    variantLabel: variant?.label,
    variantAttributes: variant?.attributes,
  };
}
