export const GIFT_CARD_PRODUCT_IDS = ["gift-card-500"];

export function isGiftCardProduct(productId: string | undefined | null) {
  if (!productId) return false;
  return GIFT_CARD_PRODUCT_IDS.includes(productId);
}
