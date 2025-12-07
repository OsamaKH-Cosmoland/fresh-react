import { ritualBundles, type RitualBundle } from "@/content/bundles";
import {
  PRODUCT_DETAIL_CONFIGS,
  type ProductDetailContent,
} from "@/content/productDetails";

export const SHOP_FOCUS_TAGS = [
  { id: "body", label: "Body hydration & glow" },
  { id: "hair", label: "Hair growth & strength" },
  { id: "hands", label: "Hands & lips care" },
] as const;

export type FocusTagId = (typeof SHOP_FOCUS_TAGS)[number]["id"];

export const SHOP_OPTIONAL_TAGS = [
  { id: "morning", label: "Morning ritual" },
  { id: "evening", label: "Evening ritual" },
  { id: "express", label: "Express ritual" },
] as const;

export type OptionalTagId = (typeof SHOP_OPTIONAL_TAGS)[number]["id"];

type TagConfig = {
  focus: FocusTagId[];
  extras?: OptionalTagId[];
};

const PRODUCT_TAGS: Record<
  ProductDetailContent["productId"],
  TagConfig
> = {
  "body-balm": { focus: ["body"], extras: ["evening"] },
  "calm-glow-body-soap": { focus: ["body"], extras: ["morning"] },
  "silk-blossom-body-soap": { focus: ["body"], extras: ["evening"] },
  "hand-balm": { focus: ["hands"], extras: ["express"] },
  "hair-growth-oil": { focus: ["hair"], extras: ["express"] },
  "hair-shine-anti-frizz-oil": { focus: ["hair"], extras: ["express"] },
};

const BUNDLE_TAGS: Record<RitualBundle["id"], TagConfig> = {
  "evening-calm-ritual": { focus: ["body"], extras: ["evening"] },
  "glow-hydrate-duo": { focus: ["body"], extras: ["morning"] },
  "hair-strength-ritual": { focus: ["hair"], extras: ["express"] },
  "hands-lips-care-set": { focus: ["hands"], extras: ["express"] },
};

export interface ShopCatalogProductEntry {
  kind: "product";
  item: ProductDetailContent;
  focus: FocusTagId[];
  extras?: OptionalTagId[];
}

export interface ShopCatalogBundleEntry {
  kind: "bundle";
  item: RitualBundle;
  focus: FocusTagId[];
  extras?: OptionalTagId[];
}

export type ShopCatalogEntry =
  | ShopCatalogProductEntry
  | ShopCatalogBundleEntry;

export const shopCatalog: ShopCatalogEntry[] = [
  ...PRODUCT_DETAIL_CONFIGS.map((product) => ({
    kind: "product" as const,
    item: product,
    focus: PRODUCT_TAGS[product.productId]?.focus ?? [],
    extras: PRODUCT_TAGS[product.productId]?.extras,
  })),
  ...ritualBundles.map((bundle) => ({
    kind: "bundle" as const,
    item: bundle,
    focus: BUNDLE_TAGS[bundle.id]?.focus ?? [],
    extras: BUNDLE_TAGS[bundle.id]?.extras,
  })),
];

export const shopFocusLookup: Record<FocusTagId, string> = SHOP_FOCUS_TAGS.reduce(
  (acc, entry) => {
    acc[entry.id] = entry.label;
    return acc;
  },
  {} as Record<FocusTagId, string>
);

export const shopOptionalLookup: Record<OptionalTagId, string> =
  SHOP_OPTIONAL_TAGS.reduce((acc, entry) => {
    acc[entry.id] = entry.label;
    return acc;
  }, {} as Record<OptionalTagId, string>);
