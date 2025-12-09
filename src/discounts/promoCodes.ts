export type PromoCollectionFocus = "body" | "hair" | "hands-lips";

export type PromoTarget =
  | { type: "cart_total"; minSubtotal?: number }
  | { type: "bundle"; bundleId: string }
  | { type: "product"; productId: string }
  | { type: "collection"; focus: PromoCollectionFocus };

export type PromoBenefit =
  | { type: "percent"; value: number }
  | { type: "fixed_amount"; value: number }
  | { type: "free_shipping" };

export type PromoCodeDefinition = {
  code: string;
  label: string;
  description?: string;
  target: PromoTarget;
  benefit: PromoBenefit;
  canStackWithBundle?: boolean;
  maxUsesPerOrder?: number;
  isActive: boolean;
};

export const PROMO_CODES: PromoCodeDefinition[] = [
  {
    code: "WELCOME10",
    label: "Welcome ritual savings",
    description: "10% off your first calm bundle after 400 EGP",
    target: { type: "cart_total", minSubtotal: 400 },
    benefit: { type: "percent", value: 10 },
    isActive: true,
  },
  {
    code: "HAIRRITUAL15",
    label: "Hair ritual focus",
    description: "15% off hair-focused treatments and bundles",
    target: { type: "collection", focus: "hair" },
    benefit: { type: "percent", value: 15 },
    canStackWithBundle: true,
    isActive: true,
  },
  {
    code: "FREESHIP",
    label: "Complimentary delivery",
    description: "Free shipping on orders above 500 EGP",
    target: { type: "cart_total", minSubtotal: 500 },
    benefit: { type: "free_shipping" },
    isActive: true,
  },
  {
    code: "GLOWDUO20",
    label: "Glowing duo upgrade",
    description: "20% off the Glow + Hydrate duo bundle",
    target: { type: "bundle", bundleId: "glow-hydrate-duo" },
    benefit: { type: "percent", value: 20 },
    canStackWithBundle: true,
    isActive: true,
  },
];
