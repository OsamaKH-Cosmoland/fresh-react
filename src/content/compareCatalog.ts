import type { ProductDetailContent } from "@/content/productDetails";
import {
  PRODUCT_DETAIL_CONFIGS,
  PRODUCT_DETAIL_MAP,
  getLocalizedProductName,
  localizeProductDetail,
} from "@/content/productDetails";
import { shopCatalog, getShopFocusLookup, getShopOptionalLookup, type FocusTagId } from "@/content/shopCatalog";
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
  "lip-balm": "10 ml tube",
  "hair-growth-oil": "60 ml dropper",
  "hair-shine-anti-frizz-oil": "60 ml dropper",
};

const productFormatMapAr: Record<string, string> = {
  "body-balm": "برطمان 200 مل",
  "calm-glow-body-soap": "قطعة 95 جم",
  "silk-blossom-body-soap": "قطعة 95 جم",
  "hand-balm": "علبة 75 مل",
  "lip-balm": "أنبوب 10 مل",
  "hair-growth-oil": "قطّارة 60 مل",
  "hair-shine-anti-frizz-oil": "قطّارة 60 مل",
};

type SupportedLocale = "en" | "ar";

const focusLookup = (ids: FocusTagId[], locale: SupportedLocale) => {
  const lookup = getShopFocusLookup(locale);
  return ids.map((focus) => lookup[focus]).filter(Boolean);
};

const usageLookup = (ids: string[], locale: SupportedLocale) => {
  const lookup = getShopOptionalLookup(locale);
  return ids.map((tagId) => lookup[tagId as keyof typeof lookup]).filter(Boolean);
};

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

export function getCompareProductConfig(productId: string, locale: SupportedLocale): CompareProductConfig | null {
  const detail = productDetailById[productId];
  if (!detail) return null;
  const localizedDetail = localizeProductDetail(detail, locale);
  return {
    id: localizedDetail.productId,
    slug: localizedDetail.slug,
    label: localizedDetail.productName,
    focus: focusLookup(productFocusMap[productId] ?? [], locale),
    benefits: localizedDetail.heroSummaryBullets.slice(0, 3),
    texture: localizedDetail.sensoryExperience.slice(0, 3),
    usage: usageLookup(productExtrasMap[productId] ?? [], locale),
    format:
      locale === "ar"
        ? productFormatMapAr[productId] ?? "الحجم القياسي"
        : productFormatMap[productId] ?? "Standard format",
    priceNumber: localizedDetail.priceNumber,
    detail: localizedDetail,
  };
}

export function getCompareBundleConfig(bundleId: string, locale: SupportedLocale): CompareBundleConfig | null {
  const bundle = ritualBundles.find((item) => item.id === bundleId);
  if (!bundle) return null;
  const included = bundle.products
    .map((entry) => getLocalizedProductName(entry.productId, locale))
    .filter(Boolean);
  const price = bundle.products.reduce((sum, entry) => {
    const detail = PRODUCT_DETAIL_MAP[entry.productId];
    if (!detail) return sum;
    return sum + (detail.priceNumber ?? 0);
  }, 0);
  const focus = focusLookup(bundleFocusMap[bundleId] ?? [], locale);
  const ritualType = usageLookup(bundleExtrasMap[bundleId] ?? [], locale);
  return {
    id: bundle.id,
    label: locale === "ar" ? bundle.nameAr ?? bundle.name : bundle.name,
    focus,
    benefits: locale === "ar" ? bundle.taglineAr ?? bundle.tagline : bundle.tagline,
    texture: [
      locale === "ar" ? bundle.descriptionAr ?? bundle.description : bundle.description,
    ],
    ritualType,
    included,
    priceNumber: price,
  };
}
