import type { ProductDetailContent } from "@/content/productDetails";

export type RitualBundle = {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  tagline: string;
  taglineAr?: string;
  description: string;
  descriptionAr?: string;
  highlight?: string;
  highlightAr?: string;
  products: { productId: ProductDetailContent["productId"]; quantity?: number }[];
  bundlePriceNumber: number;
  bundlePriceLabel?: string;
  featured?: boolean;
};

export const ritualBundles: RitualBundle[] = [
  {
    id: "evening-calm-ritual",
    slug: "evening-calm-ritual",
    name: "Evening Calm Routine",
    nameAr: "روتين سكينة المساء",
    tagline: "Wind down with buttery hydration and chamomile serenity.",
    taglineAr: "اختتمي يومك بترطيب زبدي وسكينة البابونج.",
    description: "A routine for settling in—cleanse, soften, and cocoon your skin before bedtime.",
    descriptionAr: "روتين لتهدئة المساء—نظّفي، نعّمي، واحتضني بشرتك قبل النوم.",
    highlight: "Includes travel-ready body and hand balms for routine layering.",
    highlightAr: "يتضمن بلسم الجسم واليدين بحجم مناسب للسفر لطبقات روتينية متكاملة.",
    featured: true,
    products: [
      { productId: "body-balm", variantId: "body-balm-lavender" },
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
    nameAr: "ثنائي التوهج والترطيب",
    tagline: "Polish and seal for luminous skin.",
    taglineAr: "تنقية وختم لبشرة متألقة.",
    description: "Gentle cleansing meets concentrated butter to deliver dew without weight.",
    descriptionAr: "تنظيف لطيف يلتقي بزبدة مركزة ليمنح نضارة دون ثقل.",
    products: [
      { productId: "body-balm", variantId: "body-balm-silk" },
      { productId: "silk-blossom-body-soap" },
    ],
    bundlePriceNumber: 399.99,
    bundlePriceLabel: "399.99 EGP",
  },
  {
    id: "hair-strength-ritual",
    slug: "hair-strength-ritual",
    name: "Hair Strength Routine",
    nameAr: "روتين تقوية الشعر",
    tagline: "Fortify roots, smooth strands, glow from scalp to ends.",
    taglineAr: "قوّي الجذور ونعّمي الخصلات وتألقي من الفروة حتى الأطراف.",
    description: "Stem cells and silk-like oils team up to support resilient, glossy hair.",
    descriptionAr: "خلايا جذعية وزيوت حريرية تعمل معاً لدعم شعر قوي ولامع.",
    featured: true,
    products: [
      { productId: "hair-growth-oil", variantId: "hair-growth-strength" },
      { productId: "hair-shine-anti-frizz-oil" },
    ],
    bundlePriceNumber: 389.99,
    bundlePriceLabel: "389.99 EGP",
  },
  {
    id: "hands-lips-care-set",
    slug: "hands-lips-care-set",
    name: "Hands & Lips Care Set",
    nameAr: "مجموعة عناية اليدين والشفاه",
    tagline: "Focus on the details.",
    taglineAr: "ركّزي على التفاصيل.",
    description: "The quick duo for palms and pout, perfect for on-the-go routines.",
    descriptionAr: "ثنائي سريع لليدين والشفاه، مثالي لروتيناتك أثناء التنقل.",
    products: [
      { productId: "hand-balm" },
      { productId: "lip-balm" },
    ],
    bundlePriceNumber: 299.99,
    bundlePriceLabel: "299.99 EGP",
  },
];
