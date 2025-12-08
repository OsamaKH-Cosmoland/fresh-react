import { useMemo } from "react";
import type { CartItem } from "@/cart/cartStore";
import { useCart } from "@/cart/cartStore";
import { useFavorites } from "@/favorites/favoritesStore";
import { ritualBundles, type RitualBundle } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP, type ProductDetailContent } from "@/content/productDetails";
import { useRecentlyViewed, type RecentlyViewedEntry } from "@/hooks/useRecentlyViewed";
import {
  type BudgetPreference,
  type ConcernOption,
  type ScentPreference,
  type TimePreference,
  type UserPreferences,
  useUserPreferences,
} from "@/hooks/useUserPreferences";

const MAX_SAVED_RITUALS = 3;
const MAX_FAVORITE_PRODUCTS = 4;
const MAX_FAVORITE_BUNDLES = 3;
const MAX_RECENT_PRODUCTS = 5;
const MAX_RECENT_BUNDLES = 3;

function parseTimestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export interface SavedRitualSummary {
  id: string;
  name: string;
  updatedAt: string;
  itemCount: number;
  items: CartItem[];
}

export interface PersonalizationPayload {
  savedRituals: SavedRitualSummary[];
  favoriteProducts: ProductDetailContent[];
  favoriteBundles: RitualBundle[];
  recentProducts: ProductDetailContent[];
  recentBundles: RitualBundle[];
  recentEntries: RecentlyViewedEntry[];
  preferenceHighlights: PreferenceHighlights | null;
}

export interface PreferenceHighlights {
  focus?: ConcernOption;
  time?: TimePreference | null;
  scent?: ScentPreference | null;
  bundles: RitualBundle[];
  products: ProductDetailContent[];
}

const CONCERN_BUNDLE_MAP: Record<ConcernOption, string[]> = {
  bodyHydration: ["evening-calm-ritual", "glow-hydrate-duo"],
  hairGrowth: ["hair-strength-ritual"],
  handsLips: ["hands-lips-care-set"],
};

const TIME_BUNDLE_MAP: Record<TimePreference, string[]> = {
  morning: ["glow-hydrate-duo"],
  evening: ["evening-calm-ritual"],
  both: ["glow-hydrate-duo", "evening-calm-ritual"],
  express: ["hands-lips-care-set", "hair-strength-ritual"],
};

const BUDGET_BUNDLE_MAP: Record<BudgetPreference, string[]> = {
  valueFocused: ["hands-lips-care-set", "glow-hydrate-duo"],
  premium: ["evening-calm-ritual", "hair-strength-ritual"],
};

const SCENT_PRODUCT_MAP: Record<ScentPreference, string[]> = {
  softFloral: ["body-balm"],
  fresh: ["calm-glow-body-soap"],
  warm: ["silk-blossom-body-soap"],
  unscented: ["hand-balm"],
};

const CONCERN_PRODUCT_MAP: Record<ConcernOption, string[]> = {
  bodyHydration: ["body-balm"],
  hairGrowth: ["hair-growth-oil"],
  handsLips: ["hand-balm", "lip-balm"],
};

function buildPreferenceHighlights(preferences: UserPreferences | null): PreferenceHighlights | null {
  if (!preferences || preferences.concerns.length === 0) {
    return null;
  }

  const bundleIds = new Set<string>();
  preferences.concerns.forEach((concern) => {
    (CONCERN_BUNDLE_MAP[concern] ?? []).forEach((id) => bundleIds.add(id));
  });
  if (preferences.timePreference) {
    (TIME_BUNDLE_MAP[preferences.timePreference] ?? []).forEach((id) => bundleIds.add(id));
  }
  if (preferences.budgetPreference) {
    (BUDGET_BUNDLE_MAP[preferences.budgetPreference] ?? []).forEach((id) => bundleIds.add(id));
  }
  if (bundleIds.size === 0) {
    ritualBundles.slice(0, 2).forEach((bundle) => bundleIds.add(bundle.id));
  }

  const bundles = ritualBundles.filter((bundle) => bundleIds.has(bundle.id)).slice(0, 3);

  const productSet = new Set<string>();
  preferences.concerns.forEach((concern) => {
    (CONCERN_PRODUCT_MAP[concern] ?? []).forEach((id) => productSet.add(id));
  });
  if (preferences.scentPreference) {
    (SCENT_PRODUCT_MAP[preferences.scentPreference] ?? []).forEach((id) => productSet.add(id));
  }

  const products = Array.from(productSet)
    .map((productId) => PRODUCT_DETAIL_MAP[productId])
    .filter((detail): detail is ProductDetailContent => Boolean(detail));

  return {
    focus: preferences.concerns[0],
    time: preferences.timePreference,
    scent: preferences.scentPreference,
    bundles,
    products,
  };
}

export function usePersonalizationData(): PersonalizationPayload {
  const { savedCarts } = useCart();
  const { favorites } = useFavorites();
  const recentEntries = useRecentlyViewed();
  const { preferences } = useUserPreferences();

  return useMemo(() => {
    const savedRituals = [...savedCarts]
      .sort((a, b) => parseTimestamp(b.updatedAt) - parseTimestamp(a.updatedAt))
      .slice(0, MAX_SAVED_RITUALS)
      .map((cart) => ({
        id: cart.id,
        name: cart.name,
        updatedAt: cart.updatedAt,
        itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
        items: cart.items,
      }));

    const favoriteProducts = favorites
      .filter((entry) => entry.type === "product")
      .map((entry) => PRODUCT_DETAIL_MAP[entry.id])
      .filter((detail): detail is ProductDetailContent => Boolean(detail))
      .slice(0, MAX_FAVORITE_PRODUCTS);

    const favoriteBundles = favorites
      .filter((entry) => entry.type === "bundle")
      .map((entry) => ritualBundles.find((bundle) => bundle.id === entry.id))
      .filter((bundle): bundle is RitualBundle => Boolean(bundle))
      .slice(0, MAX_FAVORITE_BUNDLES);

    const recentSorted = [...recentEntries].sort((a, b) => b.timestamp - a.timestamp);

    const recentProducts = recentSorted
      .filter((entry) => entry.type === "product")
      .map((entry) => PRODUCT_DETAIL_MAP[entry.id])
      .filter((detail): detail is ProductDetailContent => Boolean(detail))
      .slice(0, MAX_RECENT_PRODUCTS);

    const recentBundles = recentSorted
      .filter((entry) => entry.type === "bundle")
      .map((entry) => ritualBundles.find((bundle) => bundle.id === entry.id))
      .filter((bundle): bundle is RitualBundle => Boolean(bundle))
      .slice(0, MAX_RECENT_BUNDLES);

    const preferenceHighlights = buildPreferenceHighlights(preferences);

    return {
      savedRituals,
      favoriteProducts,
      favoriteBundles,
      recentProducts,
      recentBundles,
      recentEntries,
      preferenceHighlights,
    };
  }, [favorites, recentEntries, savedCarts, preferences]);
}
