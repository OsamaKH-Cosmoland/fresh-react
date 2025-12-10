import {
  getPersonalizationReasonsText,
  scoreItemsForUser,
  type PersonalizationInputs,
} from "@/personalization/personalizationEngine";
import { shopCatalog } from "@/content/shopCatalog";
import type { FavoriteEntry } from "@/favorites/favoritesStore";
import type { RecentlyViewedEntry } from "@/hooks/useRecentlyViewed";
import type { LocalOrder } from "@/types/localOrder";
import type { LocalReview } from "@/types/localReview";

const preferences = {
  concerns: ["bodyHydration"],
  timePreference: "evening",
  scentPreference: "softFloral",
  budgetPreference: "valueFocused",
};

const favorites: FavoriteEntry[] = [
  { id: "body-balm", type: "product" },
];

const recentEntries: RecentlyViewedEntry[] = [
  { id: "body-balm", type: "product", timestamp: Date.now() },
];

const orders: LocalOrder[] = [
  {
    id: "order-1",
    createdAt: "2024-01-01T00:00:00.000Z",
    items: [
      {
        id: "item-body",
        name: "Body Balm",
        price: 197.99,
        quantity: 1,
        productId: "body-balm",
      },
    ],
    totals: {
      subtotal: 197.99,
      shippingCost: 15,
      total: 212.99,
      currency: "EGP",
    },
    customer: { name: "Test", email: "test@example.com" },
    shippingAddress: {
      country: "EG",
      city: "Cairo",
      street: "123 Street",
      postalCode: "12345",
    },
    shippingMethod: {
      id: "ship-1",
      label: "Standard",
      description: "Standard",
      eta: "3-5 days",
      cost: 15,
    },
    paymentSummary: {
      methodLabel: "Card",
      status: "paid",
    },
  },
];

const reviews: LocalReview[] = [
  {
    id: "review-1",
    targetId: "body-balm",
    type: "product",
    rating: 5,
    body: "Great",
    createdAt: "2024-01-02T00:00:00.000Z",
  },
];

describe("personalizationEngine", () => {
  it("scores favorites and preference matches higher than unrelated entries", () => {
    const candidates = shopCatalog.filter(
      (entry) =>
        entry.kind === "product" &&
        ["body-balm", "hair-growth-oil"].includes(entry.item.productId)
    );

    const inputs: PersonalizationInputs = {
      preferences,
      favorites,
      recentEntries,
      orders,
      reviews,
      candidates,
      context: { intent: "shop", focus: "body" },
    };

    const scored = scoreItemsForUser(inputs);
    expect(scored).toHaveLength(2);
    expect(scored[0].id).toBe("body-balm");
    expect(scored[0].reasons).toEqual(
      expect.arrayContaining([
        "matches_concern",
        "matches_time",
        "matches_scent",
        "within_budget",
        "in_favorites",
        "recently_viewed",
        "purchased_before",
        "reviewed_by_user",
        "matches_context_focus",
      ])
    );

    expect(scored[1].id).toBe("hair-growth-oil");
    expect(scored[0].score).toBeGreaterThan(scored[1].score);
    expect(scored[1].reasons).not.toContain("matches_concern");
  });

  it("returns readable reason text for known keys", () => {
    const text = getPersonalizationReasonsText(
      ["matches_concern", "in_favorites"],
      (key) => `translated:${key}`
    );
    expect(text).toEqual(["translated:personalization.reasons.matchesConcern", "translated:personalization.reasons.inFavorites"]);
  });
});
