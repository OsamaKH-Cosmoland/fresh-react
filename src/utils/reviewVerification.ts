import { readOrders } from "@/utils/orderStorage";
import type { ReviewTargetType } from "@/types/localReview";

export function isTargetVerifiedForAnyOrder(targetId: string, type: ReviewTargetType): boolean {
  if (!targetId) return false;
  const orders = readOrders();
  for (const order of orders) {
    for (const item of order.items) {
      if (type === "bundle" && item.bundleId === targetId) {
        return true;
      }
      if (type === "product") {
        if (item.productId === targetId) {
          return true;
        }
        if (item.bundleItems?.some((bundleItem) => bundleItem.productId === targetId)) {
          return true;
        }
        if (item.giftBox?.items?.some((giftItem) => giftItem.productId === targetId)) {
          return true;
        }
      }
    }
  }
  return false;
}
