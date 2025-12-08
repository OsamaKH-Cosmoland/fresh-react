import type { BudgetPreference, ConcernOption, ScentPreference, TimePreference, UserPreferences } from "@/hooks/useUserPreferences";
import { getBundlePricing } from "@/content/bundlePricing";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { shopCatalog, type FocusTagId, type OptionalTagId, type ShopCatalogEntry } from "@/content/shopCatalog";

export type RitualCoachIntensity = "minimal" | "balanced" | "indulgent";

interface RitualCoachOptions {
  preferences: UserPreferences | null;
  intensity: RitualCoachIntensity;
  focusOverride?: FocusTagId | null;
}

interface RitualCoachMatch {
  entry: ShopCatalogEntry;
  score: number;
  focusMatch?: FocusTagId;
  timeMatch?: TimePreference | null;
  scentMatch?: ScentPreference;
  price: number;
}

export interface RitualCoachResult {
  mainRitual: RitualCoachMatch | null;
  lighterRitual: RitualCoachMatch | null;
  treats: RitualCoachMatch[];
}

const CONCERN_TO_FOCUS: Record<ConcernOption, FocusTagId> = {
  bodyHydration: "body",
  hairGrowth: "hair",
  handsLips: "hands",
};

const TIME_TO_OPTIONAL: Record<TimePreference, OptionalTagId[]> = {
  morning: ["morning"],
  evening: ["evening"],
  both: ["morning", "evening"],
  express: ["express"],
};

const SCENT_MATCH_MAP: Record<ScentPreference, string[]> = {
  softFloral: ["body-balm"],
  fresh: ["calm-glow-body-soap"],
  warm: ["silk-blossom-body-soap"],
  unscented: ["hand-balm"],
};

const estimatePrice = (entry: ShopCatalogEntry) => {
  if (entry.kind === "bundle") {
    return getBundlePricing(entry.item).bundlePrice;
  }
  return entry.item.priceNumber;
};

const matchScent = (entry: ShopCatalogEntry, scent: ScentPreference | null) => {
  if (!scent) return false;
  const scentProducts = SCENT_MATCH_MAP[scent];
  if (!scentProducts) return false;
  const productIds =
    entry.kind === "bundle"
      ? entry.item.products.map((product) => product.productId)
      : [entry.item.productId];
  return productIds.some((productId) => scentProducts.includes(productId));
};

const buildScore = ({
  entry,
  preferences,
  focusOverride,
  intensity,
}: RitualCoachOptions & { entry: ShopCatalogEntry }) => {
  let score = entry.kind === "bundle" ? 3 : 1.5;
  const userFocuses = new Set(
    (preferences?.concerns ?? []).map((concern) => CONCERN_TO_FOCUS[concern])
  );

  const matchedFocus = entry.focus.find((focus) => userFocuses.has(focus));
  if (matchedFocus) {
    score += 3;
  }
  if (focusOverride && entry.focus.includes(focusOverride)) {
    score += 2.4;
  }

  const timePreference = preferences?.timePreference;
  const timeTargets = timePreference ? TIME_TO_OPTIONAL[timePreference] ?? [] : [];
  const timeMatch = timeTargets.length > 0 && entry.extras
    ? entry.extras.some((tag) => timeTargets.includes(tag))
    : false;
  if (timeMatch) {
    score += 1.8;
  }

  const scentPreference = preferences?.scentPreference ?? null;
  const scentMatched = matchScent(entry, scentPreference);
  if (scentMatched) {
    score += 1.3;
  }

  const price = estimatePrice(entry);
  const budgetPreference = preferences?.budgetPreference;
  if (budgetPreference === "valueFocused") {
    if (price <= 360) {
      score += 1.3;
    }
    if (price > 450) {
      score -= 1.2;
    }
  }
  if (budgetPreference === "premium") {
    if (price >= 420) {
      score += 1.1;
    }
    if (price < 320) {
      score -= 0.8;
    }
  }

  if (intensity === "minimal") {
    if (entry.kind === "bundle") {
      score -= 1.5;
    } else {
      score += 0.6;
      if (price <= 260) {
        score += 0.4;
      }
    }
  }
  if (intensity === "indulgent") {
    if (entry.kind === "bundle") {
      score += 1.2;
      if (price >= 420) {
        score += 0.5;
      }
    } else {
      score -= 0.7;
    }
  }

  return {
    score,
    focusMatch: matchedFocus,
    timeMatch: timeMatch ? timePreference ?? null : null,
    scentMatch: scentMatched ? scentPreference : undefined,
    price,
  } as const;
};

export function buildRitualCoachRecommendations(options: RitualCoachOptions): RitualCoachResult {
  const { preferences, intensity, focusOverride } = options;
  const candidates = shopCatalog.map((entry) => {
    const scoring = buildScore({ entry, preferences, focusOverride, intensity });
    return { entry, ...scoring };
  });

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  const main = sorted[0] ?? null;

  const lighterCandidate = sorted.find(
    (candidate) =>
      candidate !== main &&
      candidate.entry.kind === "product"
  );
  const lighter = lighterCandidate ?? sorted.find((candidate) => candidate !== main) ?? null;

  const treatCandidates = sorted.filter(
    (candidate) =>
      candidate !== main &&
      candidate !== lighter &&
      candidate.entry.kind === "product"
  );

  return {
    mainRitual: main,
    lighterRitual: lighter,
    treats: treatCandidates.slice(0, 2),
  };
}
