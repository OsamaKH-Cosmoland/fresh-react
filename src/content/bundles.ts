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
  products: { productId: ProductDetailContent["productId"]; variantId?: string; quantity?: number }[];
  price: number;
  compareAtPrice: number;
  discountPercentage: number;
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
      { productId: "body-balm", variantId: "body-balm-50ml" },
      { productId: "calm-glow-body-soap" },
      { productId: "hand-balm", variantId: "hand-balm-50ml" },
    ],
    price: 569.99,
    compareAtPrice: 939,
    discountPercentage: 40,
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
      { productId: "body-balm", variantId: "body-balm-50ml" },
      { productId: "silk-blossom-body-soap" },
    ],
    price: 399.99,
    compareAtPrice: 524,
    discountPercentage: 24,
    bundlePriceNumber: 399.99,
    bundlePriceLabel: "399.99 EGP",
  },
  {
    id: "hair-strength-ritual",
    slug: "hair-strength-ritual",
    name: "Glow & Grow Starter Bundle",
    nameAr: "مجموعة البداية للتوهج والنمو",
    tagline: "Grow stronger roots and finish with luminous shine.",
    taglineAr: "قوّي الجذور وأكملي اللمسة بلمعان مضيء.",
    description: "A focused two-step hair ritual with growth support and glossy anti-frizz finish.",
    descriptionAr: "خلايا جذعية وزيوت حريرية تعمل معاً لدعم شعر قوي ولامع.",
    featured: true,
    products: [
      { productId: "hair-growth-oil", variantId: "hair-growth-50ml" },
      { productId: "hair-shine-anti-frizz-oil", variantId: "hair-shine-50ml" },
    ],
    price: 349,
    compareAtPrice: 585,
    discountPercentage: 40,
    bundlePriceNumber: 349,
    bundlePriceLabel: "349 EGP",
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
      { productId: "hand-balm", variantId: "hand-balm-30ml" },
      { productId: "lip-balm" },
    ],
    price: 299.99,
    compareAtPrice: 354,
    discountPercentage: 15,
    bundlePriceNumber: 299.99,
    bundlePriceLabel: "299.99 EGP",
  },
  {
    id: "ultimate-bundle",
    slug: "ultimate-bundle",
    name: "Ultimate Bundle",
    nameAr: "المجموعة الكاملة",
    tagline: "All seven premium essentials in one high-value ritual.",
    taglineAr: "كل أساسيات العناية السبع في روتين واحد بقيمة عالية.",
    description:
      "Lip care, cleansing, hair oils, and full 50ml body-and-hand moisture for the complete NaturaGloss routine.",
    descriptionAr:
      "عناية الشفاه والتنظيف وزيوت الشعر وترطيب الجسم واليدين بحجم 50 مل لروتين NaturaGloss الكامل.",
    highlight: "Includes every premium product at 50% off.",
    highlightAr: "تتضمن كل المنتجات المميزة بخصم 50%.",
    featured: true,
    products: [
      { productId: "lip-balm" },
      { productId: "calm-glow-body-soap" },
      { productId: "silk-blossom-body-soap" },
      { productId: "hair-shine-anti-frizz-oil", variantId: "hair-shine-50ml" },
      { productId: "hair-growth-oil", variantId: "hair-growth-50ml" },
      { productId: "body-balm", variantId: "body-balm-50ml" },
      { productId: "hand-balm", variantId: "hand-balm-50ml" },
    ],
    price: 649,
    compareAtPrice: 1299,
    discountPercentage: 50,
    bundlePriceNumber: 649,
    bundlePriceLabel: "649 EGP",
  },
];
