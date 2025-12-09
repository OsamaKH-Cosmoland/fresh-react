import type { LocalOrder } from "@/types/localOrder";

const formatItems = (items: LocalOrder["items"]) =>
  items.map((item) => ({
    id: item.productId || item.bundleId || item.id,
    title: item.name,
    quantity: item.quantity,
    price: item.price,
    variant: item.variantLabel,
  }));

export async function submitOrderToApi(order: LocalOrder) {
  try {
    const payload = {
      id: order.id,
      orderCode: order.id,
      customer: {
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
      },
      items: formatItems(order.items),
      totals: {
        subtotal: order.totals.subtotal,
        discount: order.totals.discountTotal,
        shipping: order.totals.shippingCost,
        grandTotal: order.totals.total,
        currency: order.totals.currency,
      },
      promoCode: order.promoCode,
      paymentMethod: "card",
      shippingMethod: order.shippingMethod?.label,
      shippingAddress: {
        city: order.shippingAddress.city,
        address: order.shippingAddress.street,
        postalCode: order.shippingAddress.postalCode,
      },
    };

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      console.warn("Server order submission failed", response.status, text);
    }
  } catch (error) {
    console.warn("Unable to send order to server", error);
  }
}
