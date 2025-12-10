import type { CartItem } from "@/cart/cartStore";
import type { UserPreferences } from "@/hooks/useUserPreferences";
import type { LocalOrder } from "@/types/localOrder";
import type { RitualTierId } from "@/loyalty/ritualPoints";

export type LifecycleChannel = "banner" | "inline" | "cart-context" | "silent";

export interface LifecycleActionPayload {
  [key: string]: unknown;
}

export interface LifecycleAction {
  ruleId: string;
  channel: LifecycleChannel;
  reasonKey: string;
  messageKey: string;
  payload?: LifecycleActionPayload;
  triggeredAt: string;
}

export interface LifecycleHistory {
  lastEvaluatedAt: string | null;
  lastAction: LifecycleAction | null;
  ruleHistory: Record<string, string>;
  dismissalHistory: Record<string, string>;
}

export interface LifecycleContext {
  cart: {
    items: CartItem[];
    itemsCount: number;
    total: number;
    lastUpdatedAt: number;
  };
  orders: {
    list: LocalOrder[];
    count: number;
    lastOrderAt: string | null;
  };
  reviews: {
    total: number;
    pending: number;
    lastReviewAt: string | null;
  };
  loyalty: {
    totalPoints: number;
    tierId: RitualTierId;
    pointsToNext: number | null;
  };
  personalization: {
    preferences: UserPreferences | null;
    savedRituals: number;
  };
  favorites: {
    count: number;
  };
  visits: {
    firstVisitAt: string | null;
    lastVisitAt: string | null;
    visitCount: number;
  };
  subscriptions: LifecycleSubscription[];
  hasSubscriptions: boolean;
  nextSubscriptionRefillAt: string | null;
  route: {
    path: string;
    view: string | null;
  };
  locale: string;
}

export interface LifecycleSubscription {
  id: string;
  name: string;
  nextRefillAt: string | null;
}

export interface LifecycleRuleDefinition {
  id: string;
  priority: number;
  reasonKey: string;
  messageKey: string;
  channel: LifecycleChannel;
  cooldownSeconds?: number;
  evaluate: (context: LifecycleContext, referenceTime: number) => LifecycleActionPayload | null;
}

export interface LifecycleDebugSnapshot {
  context: LifecycleContext;
  history: LifecycleHistory;
}

export interface LifecycleProviderValue {
  currentAction: LifecycleAction | null;
  dismissCurrentAction: () => void;
  reEvaluate: () => void;
  debugSnapshot: LifecycleDebugSnapshot;
}
