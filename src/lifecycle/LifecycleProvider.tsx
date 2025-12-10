import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useCart } from "@/cart/cartStore";
import { useFavorites } from "@/favorites/favoritesStore";
import { useLocale } from "@/localization/locale";
import { useRitualPoints } from "@/loyalty/useRitualPoints";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import type { UserPreferences } from "@/hooks/useUserPreferences";
import { listReviews, REVIEWS_UPDATE_EVENT, REVIEW_STORAGE_KEY } from "@/utils/reviewStorage";
import type { LocalReview } from "@/types/localReview";
import { ORDERS_UPDATE_EVENT, ORDER_STORAGE_KEY, readOrders } from "@/utils/orderStorage";
import {
  loadVisitSnapshot,
  recordVisit,
  VISIT_STORAGE_KEY,
  VISIT_UPDATE_EVENT,
  VisitSnapshot,
} from "./visitTracker";
import {
  REFILL_PLAN_STORAGE_KEY,
  getEarliestNextRefillAt,
  listActivePlans,
} from "@/subscriptions";
import { evaluateLifecycle } from "./engine";
import { loadLifecycleHistory, saveLifecycleHistory } from "./storage";
import type { LifecycleContext, LifecycleHistory, LifecycleProviderValue } from "./types";

const LifecycleContext = createContext<LifecycleProviderValue | null>(null);

function getRouteSnapshot() {
  if (typeof window === "undefined") {
    return { path: "/", view: null };
  }
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const view = new URLSearchParams(window.location.search).get("view");
  return { path, view };
}

const buildTargetKey = (type: "product" | "bundle", id: string) => `${type}:${id}`;

function gatherOrderTargets(orders: LifecycleContext["orders"]["list"]) {
  const targets = new Set<string>();
  for (const order of orders) {
    for (const item of order.items) {
      if (item.bundleId) {
        targets.add(buildTargetKey("bundle", item.bundleId));
      } else if (item.productId) {
        targets.add(buildTargetKey("product", item.productId));
      }
      if (item.giftBox?.items) {
        for (const giftItem of item.giftBox.items) {
          if (giftItem.productId) {
            targets.add(buildTargetKey("product", giftItem.productId));
          }
        }
      }
    }
  }
  return targets;
}

function gatherReviewTargets(reviews: LocalReview[]) {
  const targets = new Set<string>();
  for (const review of reviews) {
    targets.add(buildTargetKey(review.type, review.targetId));
  }
  return targets;
}

function computePendingReviews(orders: LifecycleContext["orders"]["list"], reviews: LocalReview[]) {
  const orderTargets = gatherOrderTargets(orders);
  if (!orderTargets.size) return 0;
  const reviewedTargets = gatherReviewTargets(reviews);
  let pending = 0;
  for (const target of orderTargets) {
    if (!reviewedTargets.has(target)) {
      pending += 1;
    }
  }
  return pending;
}

function buildLifecycleContext(params: {
  cart: LifecycleContext["cart"];
  favoritesCount: number;
  loyalty: {
    totalPoints: number;
    tierId: string;
    pointsToNext: number | null;
  };
  preferences: UserPreferences | null;
  savedRituals: number;
  orders: ReturnType<typeof readOrders>;
  reviews: LocalReview[];
  visits: VisitSnapshot;
  subscriptions: LifecycleContext["subscriptions"];
  hasSubscriptions: boolean;
  nextSubscriptionRefillAt: string | null;
  route: LifecycleContext["route"];
  locale: string;
}) {
  const {
    cart,
    favoritesCount,
    loyalty,
    preferences,
    savedRituals,
    orders,
    reviews,
    visits,
    subscriptions,
    hasSubscriptions,
    nextSubscriptionRefillAt,
    route,
    locale,
  } = params;
  const lastOrderAt = orders[0]?.createdAt ?? null;
  const pendingReviews = computePendingReviews(orders, reviews);

  const context: LifecycleContext = {
    cart: {
      items: cart.cartItems,
      itemsCount: cart.totalQuantity,
      total: cart.grandTotalAfterCreditBase,
      lastUpdatedAt: cart.lastUpdatedAt,
    },
    orders: {
      list: orders,
      count: orders.length,
      lastOrderAt,
    },
    reviews: {
      total: reviews.length,
      pending: pendingReviews,
      lastReviewAt: reviews[0]?.createdAt ?? null,
    },
    loyalty: {
      totalPoints: loyalty.totalPoints,
      tierId: loyalty.tierId,
      pointsToNext: loyalty.pointsToNext,
    },
    personalization: {
      preferences: preferences ?? null,
      savedRituals,
    },
    favorites: {
      count: favoritesCount,
    },
    visits: {
      firstVisitAt: visits.firstVisitAt,
      lastVisitAt: visits.lastVisitAt,
      visitCount: visits.visitCount,
    },
    subscriptions,
    hasSubscriptions,
    nextSubscriptionRefillAt,
    route,
    locale,
  };

  return context;
}

export function LifecycleProvider({ children }: { children: ReactNode }) {
  const cart = useCart();
  const { favorites } = useFavorites();
  const { preferences } = useUserPreferences();
  const { locale } = useLocale();
  const ritualPoints = useRitualPoints();

  const [orders, setOrders] = useState(() => readOrders());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshOrders = () => setOrders(readOrders());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_STORAGE_KEY) {
        refreshOrders();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(ORDERS_UPDATE_EVENT, refreshOrders);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(ORDERS_UPDATE_EVENT, refreshOrders);
    };
  }, []);

  const [reviews, setReviews] = useState<LocalReview[]>(() => listReviews());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshReviews = () => setReviews(listReviews());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === REVIEW_STORAGE_KEY) {
        refreshReviews();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(REVIEWS_UPDATE_EVENT, refreshReviews);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(REVIEWS_UPDATE_EVENT, refreshReviews);
    };
  }, []);

  const [visits, setVisits] = useState<VisitSnapshot>(() => loadVisitSnapshot());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updated = recordVisit();
    setVisits(updated);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === VISIT_STORAGE_KEY) {
        setVisits(loadVisitSnapshot());
      }
    };
    const handleUpdateEvent = () => setVisits(loadVisitSnapshot());
    window.addEventListener("storage", handleStorage);
    window.addEventListener(VISIT_UPDATE_EVENT, handleUpdateEvent);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(VISIT_UPDATE_EVENT, handleUpdateEvent);
    };
  }, []);

  const [refillPlans, setRefillPlans] = useState(() => listActivePlans());
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refreshPlans = () => setRefillPlans(listActivePlans());
    const handleStorage = (event: StorageEvent) => {
      if (event.key === REFILL_PLAN_STORAGE_KEY) {
        refreshPlans();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const [route, setRoute] = useState(getRouteSnapshot);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updateRoute = () => setRoute(getRouteSnapshot());
    window.addEventListener("popstate", updateRoute);
    window.addEventListener("hashchange", updateRoute);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener("hashchange", updateRoute);
    };
  }, []);

  const lifecycleSubscriptions = useMemo(
    () =>
      refillPlans.map((plan) => ({
        id: plan.id,
        name: plan.label?.trim() ? plan.label : plan.source,
        nextRefillAt: plan.nextRefillAt,
      })),
    [refillPlans]
  );
  const hasSubscriptions = refillPlans.length > 0;
  const nextSubscriptionRefillAt = getEarliestNextRefillAt(refillPlans);
  const savedRitualsCount = cart.savedCarts.length;
  const context = useMemo(
    () =>
      buildLifecycleContext({
        cart: {
          items: cart.cartItems,
          itemsCount: cart.totalQuantity,
          total: cart.grandTotalAfterCreditBase,
          lastUpdatedAt: cart.lastUpdatedAt,
        },
        favoritesCount: favorites.length,
        loyalty: {
          totalPoints: ritualPoints.state.totalPoints,
          tierId: ritualPoints.tier.id,
          pointsToNext: ritualPoints.pointsToNext,
        },
        preferences,
        savedRituals: savedRitualsCount,
        orders,
        reviews,
        visits,
        subscriptions: lifecycleSubscriptions,
        hasSubscriptions,
        nextSubscriptionRefillAt,
        route,
        locale,
      }),
    [
      cart.cartItems,
      cart.totalQuantity,
      cart.grandTotalAfterCreditBase,
      cart.lastUpdatedAt,
      savedRitualsCount,
      favorites.length,
      ritualPoints.state.totalPoints,
      ritualPoints.tier.id,
      ritualPoints.pointsToNext,
      preferences,
      orders,
      reviews,
      visits,
      lifecycleSubscriptions,
      hasSubscriptions,
      nextSubscriptionRefillAt,
      route,
      locale,
    ]
  );

  const [history, setHistory] = useState<LifecycleHistory>(() => loadLifecycleHistory());
  const [currentAction, setCurrentAction] = useState(history.lastAction);

  const runEvaluation = useCallback(() => {
    const referenceTime = Date.now();
    setHistory((previous) => {
      const { action, history: nextHistory } = evaluateLifecycle(context, previous, referenceTime);
      setCurrentAction(action);
      return nextHistory;
    });
  }, [context]);

  useEffect(() => {
    runEvaluation();
  }, [runEvaluation]);

  useEffect(() => {
    saveLifecycleHistory(history);
  }, [history]);

  const dismissCurrentAction = useCallback(() => {
    if (!currentAction) return;
    const nowIso = new Date().toISOString();
    setCurrentAction(null);
    setHistory((previous) => ({
      ...previous,
      dismissalHistory: {
        ...previous.dismissalHistory,
        [currentAction.ruleId]: nowIso,
      },
    }));
  }, [currentAction]);

  const value = useMemo<LifecycleProviderValue>(
    () => ({
      currentAction,
      dismissCurrentAction,
      reEvaluate: runEvaluation,
      debugSnapshot: {
        context,
        history,
      },
    }),
    [context, currentAction, dismissCurrentAction, history, runEvaluation]
  );

  return <LifecycleContext.Provider value={value}>{children}</LifecycleContext.Provider>;
}

export function useLifecycle() {
  const context = useContext(LifecycleContext);
  if (!context) {
    throw new Error("useLifecycle must be used within a LifecycleProvider");
  }
  return context;
}
