import type { ProductDetailContent } from "@/content/productDetails";

export type RitualBundle = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  highlight?: string;
  products: { productId: ProductDetailContent["productId"]; quantity?: number }[];
  bundlePriceNumber: number;
  bundlePriceLabel?: string;
  featured?: boolean;
};

export const ritualBundles: RitualBundle[] = [
  {
    id: "evening-calm-ritual",
    slug: "evening-calm-ritual",
    name: "Evening Calm Ritual",
    tagline: "Wind down with buttery hydration and chamomile serenity.",
    description: "A ritual for settling in—cleanse, soften, and cocoon your skin before bedtime.",
    highlight: "Includes travel-ready body and hand balms for ritual layering.",
    featured: true,
    products: [
      { productId: "body-balm" },
      { productId: "calm-glow-body-soap" },
      { productId: "hand-balm" },
    ],
    bundlePriceNumber: 569.99,
    bundlePriceLabel: "569.99 EGP",
  },
  {
    id: "glow-hydrate-duo",
    slug: "glow-hydrate-duo",
    name: "Glow & Hydrate Duo",
    tagline: "Polish and seal for luminous skin.",
    description: "Gentle cleansing meets concentrated butter to deliver dew without weight.",
    products: [
      { productId: "body-balm" },
      { productId: "silk-blossom-body-soap" },
    ],
    bundlePriceNumber: 399.99,
    bundlePriceLabel: "399.99 EGP",
  },
  {
    id: "hair-strength-ritual",
    slug: "hair-strength-ritual",
    name: "Hair Strength Ritual",
    tagline: "Fortify roots, smooth strands, glow from scalp to ends.",
    description: "Stem cells and silk-like oils team up to support resilient, glossy hair.",
    featured: true,
    products: [
      { productId: "hair-growth-oil" },
      { productId: "hair-shine-anti-frizz-oil" },
    ],
    bundlePriceNumber: 389.99,
    bundlePriceLabel: "389.99 EGP",
  },
  {
    id: "hands-lips-care-set",
    slug: "hands-lips-care-set",
    name: "Hands & Lips Care Set",
    tagline: "Focus on the details.",
    description: "The quick duo for palms and pout, perfect for on-the-go rituals.",
    products: [
      { productId: "hand-balm" },
      { productId: "lip-balm" },
    ],
    bundlePriceNumber: 299.99,
    bundlePriceLabel: "299.99 EGP",
  },
];
