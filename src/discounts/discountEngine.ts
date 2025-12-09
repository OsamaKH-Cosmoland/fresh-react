import { shopCatalog, type FocusTagId } from "@/content/shopCatalog";
import { PROMO_CODES, type PromoCollectionFocus, type PromoCodeDefinition } from "./promoCodes";

export interface CartItemLike {
  id: string;
  price: number;
  quantity: number;
  productId?: string;
  bundleId?: string;
}

export interface CartStateLike {
  items: CartItemLike[];
  subtotal: number;
}

const focusLookup = new Map<string, FocusTagId[]>();
shopCatalog.forEach((entry) => {
  const key = entry.kind === "product" ? entry.item.productId : entry.item.id;
  focusLookup.set(key, entry.focus);
});

const COLLECTION_FOCUS_MAP: Record<PromoCollectionFocus, FocusTagId[]> = {
  body: ["body"],
  hair: ["hair"],
  "hands-lips": ["hands"],
};

export interface AppliedPromo {
  code: string;
  label: string;
  discountAmount: number;
  freeShipping: boolean;
  affectedItemIds: string[];
}

export type ApplyPromoResult =
  | { status: "applied"; applied: AppliedPromo }
  | { status: "invalid" | "not_applicable" };

const clampBundle = (promo: PromoCodeDefinition, item: CartItemLike) => {
  if (!promo.canStackWithBundle && item.bundleId) {
    return false;
  }
  return true;
};

const matchesCollection = (item: CartItemLike, focusKey: PromoCollectionFocus) => {
  const lookup = focusLookup.get(item.productId ?? item.bundleId ?? "");
  if (!lookup) return false;
  const allowed = new Set(COLLECTION_FOCUS_MAP[focusKey]);
  return lookup.some((focus) => allowed.has(focus));
};

export function evaluatePromoForCart(
  promo: PromoCodeDefinition,
  cart: CartStateLike,
  shippingCost: number
): AppliedPromo | null {
  const { items } = cart;
  const targetItems = items.filter((item) => {
    if (item.quantity <= 0 || item.price <= 0 || !clampBundle(promo, item)) {
      return false;
    }
    switch (promo.target.type) {
      case "cart_total":
        return true;
      case "bundle":
        return item.bundleId === promo.target.bundleId;
      case "product":
        return item.productId === promo.target.productId;
      case "collection":
        return matchesCollection(item, promo.target.focus);
      default:
        return false;
    }
  });

  if (targetItems.length === 0 && promo.benefit.type !== "free_shipping") {
    return null;
  }

  const applicableTotal = targetItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (promo.target.type === "cart_total" && promo.target.minSubtotal) {
    if (applicableTotal < promo.target.minSubtotal) {
      return null;
    }
  }

  let discountAmount = 0;
  if (promo.benefit.type === "percent") {
    discountAmount = (applicableTotal * promo.benefit.value) / 100;
  } else if (promo.benefit.type === "fixed_amount") {
    discountAmount = Math.min(promo.benefit.value, applicableTotal);
  }

  const hasSavings = promo.benefit.type !== "free_shipping" ? discountAmount > 0 : true;
  if (!hasSavings) {
    return null;
  }

  return {
    code: promo.code,
    label: promo.label,
    discountAmount: Number(discountAmount.toFixed(2)),
    freeShipping: promo.benefit.type === "free_shipping",
    affectedItemIds: targetItems.map((item) => item.id),
  };
}

export function bestApplicablePromo(
  code: string,
  cart: CartStateLike,
  shippingCost: number
): AppliedPromo | null {
  const normalized = code.trim().toUpperCase();
  const promo = PROMO_CODES.find((entry) => entry.code === normalized && entry.isActive);
  if (!promo) return null;
  return evaluatePromoForCart(promo, cart, shippingCost);
}
