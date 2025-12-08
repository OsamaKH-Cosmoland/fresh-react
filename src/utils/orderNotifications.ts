import type { CartItem } from "@/cart/cartStore";
import { formatVariantMeta } from "@/utils/variantDisplay";

export interface OrderNotificationPayload {
  orderId: string;
  orderNumber: string;
  email: string;
  total: number;
  currency: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    variant?: string | null;
  }[];
  customerName?: string;
  phone?: string;
  shippingMethod?: string;
  shippingAddress?: string;
}

export async function notifyOrderCreated(payload: OrderNotificationPayload) {
  try {
    const response = await fetch("/api/order-created", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.warn("Order notification failed:", response.status, body);
    }
  } catch (error) {
    console.warn("Failed to notify order creation:", error);
  }
}

export function buildNotificationItems(items: CartItem[]) {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    variant: formatVariantMeta(item.variantLabel, item.variantAttributes),
  }));
}
