import type { AppTranslationKey } from "@/localization/locale";

const COLLECTION_OG_IMAGE = new URL("../assets/collection.png", import.meta.url).toString();
const GUIDE_OG_IMAGE = new URL("../assets/BodyHandBalmCalmGlow.jpg", import.meta.url).toString();
const LANDING_OG_IMAGE = new URL("../assets/NaturaGloss_shiny_gold_icon_right.webp", import.meta.url).toString();

export type SeoRoute =
  | "landing"
  | "shop"
  | "product"
  | "guides"
  | "guide_detail"
  | "gift_builder"
  | "finder"
  | "coach"
  | "account"
  | "favorites"
  | "compare"
  | "checkout"
  | "orders_history"
  | "search"
  | "onboarding";

export interface RouteMetaEntry {
  titleKey: AppTranslationKey;
  descriptionKey?: AppTranslationKey;
  canonicalPath: string;
  type: "website" | "article" | "product";
  ogImageUrl?: string;
  extraMeta?: { name?: string; property?: string; content: string }[];
}

export const ROUTE_META: Record<SeoRoute, RouteMetaEntry> = {
  landing: {
    titleKey: "meta.titles.home",
    descriptionKey: "meta.descriptions.home",
    canonicalPath: "/",
    type: "website",
    ogImageUrl: LANDING_OG_IMAGE,
  },
  shop: {
    titleKey: "meta.titles.shop",
    descriptionKey: "meta.descriptions.shop",
    canonicalPath: "/shop",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  product: {
    titleKey: "meta.titles.product",
    descriptionKey: "meta.descriptions.product",
    canonicalPath: "/products",
    type: "product",
  },
  guides: {
    titleKey: "meta.titles.ritualGuides",
    descriptionKey: "meta.descriptions.guideList",
    canonicalPath: "/ritual-guides",
    type: "article",
    ogImageUrl: GUIDE_OG_IMAGE,
  },
  guide_detail: {
    titleKey: "meta.titles.ritualGuides",
    descriptionKey: "meta.descriptions.guideDetail",
    canonicalPath: "/ritual-guides",
    type: "article",
    ogImageUrl: GUIDE_OG_IMAGE,
  },
  gift_builder: {
    titleKey: "meta.titles.giftBuilder",
    descriptionKey: "meta.descriptions.giftBuilder",
    canonicalPath: "/gift-builder",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  finder: {
    titleKey: "meta.titles.ritualFinder",
    descriptionKey: "meta.descriptions.finder",
    canonicalPath: "/ritual-finder",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  coach: {
    titleKey: "meta.titles.ritualCoach",
    descriptionKey: "meta.descriptions.coach",
    canonicalPath: "/ritual-coach",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  account: {
    titleKey: "meta.titles.account",
    descriptionKey: "meta.descriptions.account",
    canonicalPath: "/account",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  favorites: {
    titleKey: "meta.titles.favorites",
    descriptionKey: "meta.descriptions.favorites",
    canonicalPath: "/favorites",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  compare: {
    titleKey: "meta.titles.compare",
    descriptionKey: "meta.descriptions.compare",
    canonicalPath: "/compare",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  checkout: {
    titleKey: "meta.titles.checkout",
    descriptionKey: "meta.descriptions.checkout",
    canonicalPath: "/checkout",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  orders_history: {
    titleKey: "meta.titles.orders",
    descriptionKey: "meta.descriptions.orders",
    canonicalPath: "/orders-history",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  search: {
    titleKey: "meta.titles.search",
    descriptionKey: "meta.descriptions.search",
    canonicalPath: "/search",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
  onboarding: {
    titleKey: "meta.titles.onboarding",
    descriptionKey: "meta.descriptions.onboarding",
    canonicalPath: "/onboarding",
    type: "website",
    ogImageUrl: COLLECTION_OG_IMAGE,
  },
};
