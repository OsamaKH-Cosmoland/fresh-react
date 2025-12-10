import { giftBoxStyles } from "@/content/giftBoxes";
import { ritualBundles } from "@/content/bundles";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { listAudience } from "@/utils/audienceStorage";
import { getTierFromPoints, loadRitualPointsState } from "@/loyalty/ritualPoints";
import { listReferralAttributions } from "@/utils/referralStorage";
import { listReviews } from "@/utils/reviewStorage";
import { readOrders } from "@/utils/orderStorage";
import type { FavoriteEntry } from "@/favorites/favoritesStore";
import type { CompareEntry } from "@/compare/compareStore";
import type { AnalyticsEvent } from "@/analytics/events";
import type { FlowUsageSummary, OrdersSummary, ReferralSummary, TopItem } from "./analyticsTypes";

const FAVORITES_KEY = "naturagloss_favorites";
const COMPARE_KEY = "naturagloss_compare";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const readListFromStorage = <T>(key: string): T[] => {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
  } catch {
    // ignore parse errors
  }
  return [];
};

const readAnalyticsEvents = () => {
  if (typeof window === "undefined") return [] as AnalyticsEvent[];
  const buffer = window.__NATURAGLOSS_ANALYTICS_EVENTS__;
  if (!Array.isArray(buffer)) return [];
  return buffer as AnalyticsEvent[];
};

const resolveProductName = (productId: string, fallback: string) =>
  PRODUCT_DETAIL_MAP[productId]?.productName ?? fallback;

const resolveBundleName = (bundleId: string, fallback: string) =>
  ritualBundles.find((entry) => entry.id === bundleId)?.name ?? fallback;

const resolveGiftName = (giftId: string | undefined, fallback: string) => {
  if (giftId) {
    const style = giftBoxStyles.find((entry) => entry.id === giftId);
    if (style) return style.name;
  }
  return fallback;
};

export function computeOrdersSummary(): OrdersSummary {
  const orders = readOrders();
  const ordersCount = orders.length;
  const totalRevenueBase = orders.reduce((sum, order) => sum + order.totals.total, 0);
  const averageOrderValueBase = ordersCount ? totalRevenueBase / ordersCount : 0;

  let firstOrderAt: string | undefined;
  let lastOrderAt: string | undefined;
  const customerFrequency = new Map<string, number>();

  orders.forEach((order) => {
    const timestamp = order.createdAt;
    if (!firstOrderAt || timestamp < firstOrderAt) {
      firstOrderAt = timestamp;
    }
    if (!lastOrderAt || timestamp > lastOrderAt) {
      lastOrderAt = timestamp;
    }
    const email = order.customer.email.trim().toLowerCase();
    if (!email) return;
    const count = customerFrequency.get(email) ?? 0;
    customerFrequency.set(email, count + 1);
  });

  const repeatCustomerEstimate = Math.max(0, ordersCount - customerFrequency.size);

  return {
    ordersCount,
    totalRevenueBase,
    averageOrderValueBase,
    firstOrderAt,
    lastOrderAt,
    repeatCustomerEstimate,
  };
}

export function computeTopItems(limit = 5): TopItem[] {
  const orders = readOrders();
  const accumulator = new Map<string, TopItem>();

  const addItem = (entryId: string, type: TopItem["type"], name: string, quantity: number, revenue: number) => {
    if (quantity <= 0 || !Number.isFinite(revenue)) return;
    const current = accumulator.get(entryId);
    if (current) {
      current.totalQuantity += quantity;
      current.totalRevenueBase += revenue;
    } else {
      accumulator.set(entryId, {
        id: entryId,
        type,
        name,
        totalQuantity: quantity,
        totalRevenueBase: revenue,
      });
    }
  };

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const quantity = item.quantity ?? 1;
      const revenue = (item.price ?? 0) * quantity;
      if (item.bundleId) {
        const name = resolveBundleName(item.bundleId, item.name);
        addItem(item.bundleId, "bundle", name, quantity, revenue);
        return;
      }
      if (item.giftBoxId || item.giftBox) {
        const id = item.giftBoxId ?? item.id;
        const name = resolveGiftName(item.giftBoxId, item.name);
        addItem(id, "gift", name, quantity, revenue);
        return;
      }
      const id = item.productId ?? item.id;
      const name = resolveProductName(item.productId ?? id, item.name);
      addItem(id, "product", name, quantity, revenue);
    });
  });

  return Array.from(accumulator.values())
    .sort((a, b) => b.totalRevenueBase - a.totalRevenueBase)
    .slice(0, limit);
}

export function computeRatingsByTarget() {
  const reviews = listReviews();
  const counters: Record<string, { total: number; count: number }> = {};

  reviews.forEach((review) => {
    const key = review.targetId;
    if (!key) return;
    const existing = counters[key] ?? { total: 0, count: 0 };
    existing.total += review.rating;
    existing.count += 1;
    counters[key] = existing;
  });

  const result: Record<string, { average: number; count: number }> = {};
  Object.entries(counters).forEach(([targetId, { total, count }]) => {
    result[targetId] = { average: total / count, count };
  });
  return result;
}

export function computeFavoritesSummary() {
  const favorites = readListFromStorage<FavoriteEntry>(FAVORITES_KEY);
  return {
    totalFavorites: favorites.length,
    topFavoriteIds: favorites.map((entry) => entry.id),
  };
}

export function computeCompareSummary() {
  const compared = readListFromStorage<CompareEntry>(COMPARE_KEY);
  return {
    totalCompared: compared.length,
    mostComparedIds: compared.map((entry) => entry.id),
  };
}

export function computeAudienceSummary() {
  const contacts = listAudience();
  const withOrdersEstimate = contacts.filter((contact) => (contact.ordersCount ?? 0) > 0).length;
  return {
    totalContacts: contacts.length,
    withOrdersEstimate,
  };
}

export function computeLoyaltySummary() {
  const loyalty = loadRitualPointsState();
  const points = loyalty.totalPoints ?? 0;
  const currentTier = getTierFromPoints(points);
  return {
    totalPoints: points,
    currentTierLabel: currentTier.name,
  };
}

export function computeFlowUsageSummary(): FlowUsageSummary {
  const orders = readOrders();
  const events = readAnalyticsEvents();
  const hasEvent = (type: AnalyticsEvent["type"]) =>
    events.some((event) => event.type === type);
  const usedGiftBuilder =
    hasEvent("gift_builder_completed") ||
    orders.some((order) => order.items.some((item) => Boolean(item.giftBoxId || item.giftBox)));
  return {
    usedFinder: hasEvent("finder_completed"),
    usedCoach: hasEvent("coach_completed"),
    usedGiftBuilder,
  };
}

export function computeReferralSummary(limit = 5): ReferralSummary {
  const entries = listReferralAttributions();
  const totalReferrals = entries.length;
  const totalCreditBase = entries.reduce((sum, entry) => sum + (entry.creditAwardedBase ?? 0), 0);
  const grouped = new Map<string, { orders: number; creditBase: number }>();
  entries.forEach((entry) => {
    const current = grouped.get(entry.code) ?? { orders: 0, creditBase: 0 };
    current.orders += 1;
    current.creditBase += entry.creditAwardedBase ?? 0;
    grouped.set(entry.code, current);
  });
  const topCodes = Array.from(grouped.entries())
    .map(([code, data]) => ({
      code,
      orders: data.orders,
      creditBase: data.creditBase,
    }))
    .sort((a, b) => b.orders - a.orders || b.creditBase - a.creditBase)
    .slice(0, limit);
  return {
    totalReferrals,
    totalCreditBase,
    topCodes,
  };
}
