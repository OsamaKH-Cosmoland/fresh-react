import type { ShopCatalogEntry, FocusTagId } from "@/content/shopCatalog";
import { shopCatalog } from "@/content/shopCatalog";
import type {
  ConcernOption,
  ScentPreference,
  TimePreference,
  UserPreferences,
} from "@/hooks/useUserPreferences";
import type { FavoriteEntry } from "@/favorites/favoritesStore";
import type { RecentlyViewedEntry } from "@/hooks/useRecentlyViewed";
import type { LocalOrder } from "@/types/localOrder";
import type { LocalReview } from "@/types/localReview";

export type PersonalizationIntent = "landing" | "shop" | "search" | "coach" | "finder";

export interface CandidateIdentifier {
  id: string;
  type: "product" | "bundle";
}

export interface PersonalizationContext {
  intent: PersonalizationIntent;
  focus?: FocusTagId | "all";
  candidateIds?: CandidateIdentifier[];
}

export type PersonalizationReasonKey =
  | "matches_concern"
  | "matches_time"
  | "matches_scent"
  | "within_budget"
  | "premium_budget_choice"
  | "in_favorites"
  | "recently_viewed"
  | "purchased_before"
  | "reviewed_by_user"
  | "high_global_rating"
  | "matches_context_focus";

export interface PersonalizationScore {
  id: string;
  type: "product" | "bundle";
  score: number;
  reasons: PersonalizationReasonKey[];
  entry: ShopCatalogEntry;
}

export interface PersonalizationInputs {
  preferences: UserPreferences | null;
  favorites: FavoriteEntry[];
  recentEntries: RecentlyViewedEntry[];
  orders: LocalOrder[];
  reviews: LocalReview[];
  candidates?: ShopCatalogEntry[];
  context?: PersonalizationContext;
}

const FOCUS_TO_CONCERN: Record<FocusTagId, ConcernOption> = {
  body: "bodyHydration",
  hair: "hairGrowth",
  hands: "handsLips",
};

const EXTRA_TO_TIME: Record<string, TimePreference> = {
  morning: "morning",
  evening: "evening",
  express: "express",
};

const SCENT_PRODUCT_MAP: Record<ScentPreference, string[]> = {
  softFloral: ["body-balm"],
  fresh: ["calm-glow-body-soap"],
  warm: ["silk-blossom-body-soap"],
  unscented: ["hand-balm"],
};

const BUNDLE_SCENT_MAP: Record<ScentPreference, string[]> = {
  softFloral: ["evening-calm-ritual"],
  fresh: ["glow-hydrate-duo"],
  warm: ["evening-calm-ritual", "glow-hydrate-duo"],
  unscented: ["hands-lips-care-set"],
};

const BASE_WEIGHTS = {
  concern: 26,
  time: 16,
  scent: 14,
  budget: 8,
  favorite: 38,
  recent: 18,
  purchased: 24,
  reviewed: 20,
  rating: 6,
  contextFocus: 12,
  valuePenalty: -8,
};

const buildKey = (kind: "product" | "bundle", id: string) => `${kind}:${id}`;

export function findEntriesByCandidateIds(candidateIds: CandidateIdentifier[]) {
  if (!candidateIds || candidateIds.length === 0) return [];
  const seen = new Set<string>();
  return candidateIds
    .map((candidate) => {
      const entry = shopCatalog.find((catalogEntry) => {
        const entryId =
          catalogEntry.kind === "product"
            ? catalogEntry.item.productId
            : catalogEntry.item.id;
        return catalogEntry.kind === candidate.type && entryId === candidate.id;
      });
      if (!entry) return null;
      const key =
        entry.kind === "product"
          ? buildKey("product", entry.item.productId)
          : buildKey("bundle", entry.item.id);
      if (seen.has(key)) return null;
      seen.add(key);
      return entry;
    })
    .filter(Boolean) as ShopCatalogEntry[];
}

export function scoreItemsForUser(inputs: PersonalizationInputs): PersonalizationScore[] {
  const {
    preferences,
    favorites,
    recentEntries,
    orders,
    reviews,
    candidates,
    context,
  } = inputs;

  const candidateEntriesFromIds =
    context?.candidateIds && !candidates ? findEntriesByCandidateIds(context.candidateIds) : null;
  const pool = candidates ?? candidateEntriesFromIds ?? shopCatalog;

  const favoriteSet = new Set(
    favorites.map((entry) => buildKey(entry.type, entry.id))
  );
  const recentSet = new Set(
    recentEntries.map((entry) => buildKey(entry.type, entry.id))
  );

  const purchasedSet = new Set<string>();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (item.bundleId) {
        purchasedSet.add(buildKey("bundle", item.bundleId));
      }
      const productId = item.productId ?? item.id;
      if (productId) {
        purchasedSet.add(buildKey("product", productId));
      }
    });
  });

  const userReviewedSet = new Set<string>();
  const ratingAccumulator: Record<string, { sum: number; count: number }> = {};
  reviews.forEach((review) => {
    const key = buildKey(review.type, review.targetId);
    userReviewedSet.add(key);
    if (!ratingAccumulator[key]) {
      ratingAccumulator[key] = { sum: 0, count: 0 };
    }
    ratingAccumulator[key].sum += review.rating;
    ratingAccumulator[key].count += 1;
  });

  const getAverageRating = (key: string) => {
    const data = ratingAccumulator[key];
    if (!data || data.count === 0) return null;
    return data.sum / data.count;
  };

  const scorer = (entry: ShopCatalogEntry): PersonalizationScore => {
    const id = entry.kind === "product" ? entry.item.productId : entry.item.id;
    const key = buildKey(entry.kind, id);
    let score = 0;
    const reasons: PersonalizationReasonKey[] = [];
    const addReason = (reason: PersonalizationReasonKey, weight: number) => {
      score += weight;
      if (!reasons.includes(reason)) {
        reasons.push(reason);
      }
    };

    const price =
      entry.kind === "product"
        ? entry.item.priceNumber ?? 0
        : entry.item.bundlePriceNumber ?? 0;

    if (preferences && preferences.concerns.length > 0) {
      const concernMatch = entry.focus.some(
        (focus) => preferences.concerns.includes(FOCUS_TO_CONCERN[focus])
      );
      if (concernMatch) {
        addReason("matches_concern", BASE_WEIGHTS.concern);
      }
    }

    if (preferences && preferences.timePreference) {
      const timeMatch = entry.extras?.some(
        (extra) => EXTRA_TO_TIME[extra] === preferences.timePreference
      );
      if (timeMatch) {
        addReason("matches_time", BASE_WEIGHTS.time);
      }
    }

    if (preferences && preferences.scentPreference) {
      const scentMatch =
        entry.kind === "product"
          ? SCENT_PRODUCT_MAP[preferences.scentPreference]?.includes(entry.item.productId)
          : BUNDLE_SCENT_MAP[preferences.scentPreference]?.includes(entry.item.id);
      if (scentMatch) {
        addReason("matches_scent", BASE_WEIGHTS.scent);
      }
    }

    if (preferences && preferences.budgetPreference) {
      if (preferences.budgetPreference === "valueFocused") {
        if (price <= 350) {
          addReason("within_budget", BASE_WEIGHTS.budget);
        } else {
          score += BASE_WEIGHTS.valuePenalty;
        }
      } else {
        addReason("premium_budget_choice", BASE_WEIGHTS.budget / 2);
      }
    }

    if (favoriteSet.has(key)) {
      addReason("in_favorites", BASE_WEIGHTS.favorite);
    }
    if (recentSet.has(key)) {
      addReason("recently_viewed", BASE_WEIGHTS.recent);
    }
    if (purchasedSet.has(key)) {
      addReason("purchased_before", BASE_WEIGHTS.purchased);
    }
    if (userReviewedSet.has(key)) {
      addReason("reviewed_by_user", BASE_WEIGHTS.reviewed);
    }

    const avgRating = getAverageRating(key);
    if (avgRating && avgRating >= 4.2) {
      addReason("high_global_rating", BASE_WEIGHTS.rating);
    }

    if (context?.focus && context.focus !== "all" && entry.focus.includes(context.focus)) {
      addReason("matches_context_focus", BASE_WEIGHTS.contextFocus);
    }

    return {
      id,
      type: entry.kind,
      score,
      reasons,
      entry,
    };
  };

  return pool
    .map((entry) => scorer(entry))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

export function getTopRecommendations({
  preferences,
  favorites,
  recentEntries,
  orders,
  reviews,
  candidates,
  context,
  limit = 4,
}: PersonalizationInputs & { limit?: number }) {
  const scored = scoreItemsForUser({
    preferences,
    favorites,
    recentEntries,
    orders,
    reviews,
    candidates,
    context,
  });
  const products = scored.filter((item) => item.type === "product").slice(0, limit);
  const bundles = scored.filter((item) => item.type === "bundle").slice(0, limit);
  return { products, bundles };
}

export function getPersonalizationReasonsText(
  reasons: PersonalizationReasonKey[],
  t: (key: string) => string
): string[] {
  const mapping: Record<PersonalizationReasonKey, string> = {
    matches_concern: t("personalization.reasons.matchesConcern"),
    matches_time: t("personalization.reasons.matchesTime"),
    matches_scent: t("personalization.reasons.matchesScent"),
    within_budget: t("personalization.reasons.withinBudget"),
    premium_budget_choice: t("personalization.reasons.premiumBudget"),
    in_favorites: t("personalization.reasons.inFavorites"),
    recently_viewed: t("personalization.reasons.recentlyViewed"),
    purchased_before: t("personalization.reasons.purchasedBefore"),
    reviewed_by_user: t("personalization.reasons.reviewedByYou"),
    high_global_rating: t("personalization.reasons.highGlobalRating"),
    matches_context_focus: t("personalization.reasons.matchesContextFocus"),
  };
  return reasons
    .map((reason) => mapping[reason])
    .filter((text): text is string => Boolean(text));
}
