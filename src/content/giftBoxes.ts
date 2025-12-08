import type { ProductDetailContent } from "@/content/productDetails";

export interface GiftBoxStyle {
  id: string;
  name: string;
  description: string;
  price: number;
  color: string;
  image?: string;
}

export interface GiftAddOn {
  id: string;
  label: string;
  description: string;
  price: number;
}

export const giftBoxStyles: GiftBoxStyle[] = [
  {
    id: "classic-kraft",
    name: "Classic Kraft Box",
    description: "Earthy kraft with gold foil, ideal for timeless routines.",
    price: 120,
    color: "#A4752B",
  },
  {
    id: "blush-satin",
    name: "Blush Satin Box",
    description: "Velvet blush wrap with satin ribbon for soft celebrations.",
    price: 160,
    color: "#D8B4A6",
  },
  {
    id: "midnight-glow",
    name: "Midnight Glow",
    description: "Deep green shell with luminous lining for luxe gifting.",
    price: 200,
    color: "#0F2D1D",
  },
];

export const giftAddOns: GiftAddOn[] = [
  {
    id: "silk-ribbon",
    label: "Silk ribbon",
    description: "Hand-tied silk ribbon for a polished finish.",
    price: 45,
  },
  {
    id: "note-card",
    label: "Note card",
    description: "Hand-written card in crisp paper stock (message step still available).",
    price: 35,
  },
];

export const GIFT_BOX_MIN_PRODUCTS = 2;
export const GIFT_BOX_MAX_PRODUCTS = 4;
