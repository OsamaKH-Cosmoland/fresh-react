import { useMemo } from "react";
import type { CartItem } from "@/cart/cartStore";
import { useCart } from "@/cart/cartStore";
import { useFavorites } from "@/favorites/favoritesStore";
import { ritualBundles, type RitualBundle } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP, type ProductDetailContent } from "@/content/productDetails";
import { useRecentlyViewed, type RecentlyViewedEntry } from "@/hooks/useRecentlyViewed";

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
}

export function usePersonalizationData(): PersonalizationPayload {
  const { savedCarts } = useCart();
  const { favorites } = useFavorites();
  const recentEntries = useRecentlyViewed();

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

    return {
      savedRituals,
      favoriteProducts,
      favoriteBundles,
      recentProducts,
      recentBundles,
      recentEntries,
    };
  }, [favorites, recentEntries, savedCarts]);
}
