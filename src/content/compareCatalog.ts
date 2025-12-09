import type { ProductDetailContent } from "@/content/productDetails";
import { PRODUCT_DETAIL_CONFIGS } from "@/content/productDetails";
import { shopCatalog, shopFocusLookup, shopOptionalLookup, type FocusTagId } from "@/content/shopCatalog";
import { ritualBundles, type RitualBundle } from "@/content/bundles";

type CompareProductConfig = {
  id: string;
  slug: string;
  label: string;
  focus: string[];
  benefits: string[];
  texture: string[];
  usage: string[];
  format: string;
  priceNumber: number;
  detail: ProductDetailContent;
};

type CompareBundleConfig = {
  id: string;
  label: string;
  focus: string[];
  benefits: string;
  texture: string[];
  ritualType: string[];
  included: string[];
  priceNumber: number;
};

const productFormatMap: Record<string, string> = {
  "body-balm": "200 ml jar",
  "calm-glow-body-soap": "95 g bar",
  "silk-blossom-body-soap": "95 g bar",
  "hand-balm": "75 ml pot",
  "hair-growth-oil": "60 ml dropper",
  "hair-shine-anti-frizz-oil": "60 ml dropper",
};

const focusLookup = (ids: FocusTagId[]) =>
  ids.map((focus) => shopFocusLookup[focus]).filter(Boolean);

const usageLookup = (ids: string[]) =>
  ids.map((tagId) => shopOptionalLookup[tagId as keyof typeof shopOptionalLookup]).filter(Boolean);

const productDetailById = PRODUCT_DETAIL_CONFIGS.reduce<Record<string, ProductDetailContent>>(
  (acc, config) => {
    acc[config.productId] = config;
    return acc;
  },
  {}
);

const productFocusMap = shopCatalog.reduce<Record<string, FocusTagId[]>>((acc, entry) => {
  if (entry.kind === "product") {
    acc[entry.item.productId] = entry.focus;
  }
  return acc;
}, {});

const productExtrasMap = shopCatalog.reduce<Record<string, string[]>>((acc, entry) => {
  if (entry.kind === "product") {
    acc[entry.item.productId] = entry.extras ?? [];
  }
  return acc;
}, {});

const bundleFocusMap = shopCatalog.reduce<Record<string, FocusTagId[]>>((acc, entry) => {
  if (entry.kind === "bundle") {
    acc[entry.item.id] = entry.focus;
  }
  return acc;
}, {});

const bundleExtrasMap = shopCatalog.reduce<Record<string, string[]>>((acc, entry) => {
  if (entry.kind === "bundle") {
    acc[entry.item.id] = entry.extras ?? [];
  }
  return acc;
}, {});

export function getCompareProductConfig(productId: string): CompareProductConfig | null {
  const detail = productDetailById[productId];
  if (!detail) return null;
  return {
    id: detail.productId,
    slug: detail.slug,
    label: detail.productName,
    focus: focusLookup(productFocusMap[productId] ?? []),
    benefits: detail.heroSummaryBullets.slice(0, 3),
    texture: detail.sensoryExperience.slice(0, 3),
    usage: usageLookup(productExtrasMap[productId] ?? []),
    format: productFormatMap[productId] ?? "Standard format",
    priceNumber: detail.priceNumber,
    detail,
  };
}

export function getCompareBundleConfig(bundleId: string): CompareBundleConfig | null {
  const bundle = ritualBundles.find((item) => item.id === bundleId);
  if (!bundle) return null;
  const included = bundle.products
    .map((entry) => PRODUCT_DETAIL_MAP[entry.productId]?.productName ?? entry.productId)
    .filter(Boolean);
  const price = bundle.products.reduce((sum, entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    if (!detail) return sum;
    return sum + (detail.priceNumber ?? 0);
  }, 0);
  const focus = focusLookup(bundleFocusMap[bundleId] ?? []);
  const ritualType = usageLookup(bundleExtrasMap[bundleId] ?? []);
  return {
    id: bundle.id,
    label: bundle.name,
    focus,
    benefits: bundle.tagline,
    texture: [bundle.description],
    ritualType,
    included,
    priceNumber: price,
  };
}
