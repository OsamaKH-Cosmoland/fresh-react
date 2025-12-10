import type { LifecycleContext, LifecycleRuleDefinition } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
const ABANDONED_CART_THRESHOLD_MS = DAY_MS;
const REVIEW_REMINDER_DELAY_MS = 3 * DAY_MS;
const INACTIVE_ORDER_THRESHOLD_MS = 30 * DAY_MS;
const SUBSCRIPTION_WINDOW_MS = 7 * DAY_MS;
const LOYALTY_ALERT_THRESHOLD = 50;

const toDays = (ms: number) => Math.max(0, Math.floor(ms / DAY_MS));

const hasRecentOrder = (context: LifecycleContext, referenceTime: number, thresholdMs: number) => {
  if (!context.orders.lastOrderAt) return false;
  const lastOrderMs = new Date(context.orders.lastOrderAt).getTime();
  return referenceTime - lastOrderMs < thresholdMs;
};

export const lifecycleRules: LifecycleRuleDefinition[] = [
  {
    id: "first_visit_welcome",
    priority: 10,
    channel: "banner",
    reasonKey: "lifecycle.reasons.firstVisit",
    messageKey: "lifecycle.messages.firstVisit",
    cooldownSeconds: 365 * DAY_MS / 1000,
    evaluate(context) {
      return context.visits.visitCount === 1 ? {} : null;
    },
  },
  {
    id: "subscription_refill_soon",
    priority: 20,
    channel: "cart-context",
    reasonKey: "lifecycle.reasons.subscriptionRefill",
    messageKey: "lifecycle.messages.subscriptionRefill",
    cooldownSeconds: DAY_MS / 1000,
    evaluate(context, referenceTime) {
      if (!context.hasSubscriptions) return null;
      for (const subscription of context.subscriptions) {
        if (!subscription.nextRefillAt) continue;
        const refillMs = new Date(subscription.nextRefillAt).getTime();
        const delta = refillMs - referenceTime;
        if (delta >= 0 && delta <= SUBSCRIPTION_WINDOW_MS) {
          const refillDateLabel = new Intl.DateTimeFormat(context.locale, {
            month: "short",
            day: "numeric",
          }).format(refillMs);
          return {
            subscriptionName: subscription.name,
            subscriptionId: subscription.id,
            refillDate: refillDateLabel,
            daysUntilRefill: toDays(delta),
          };
        }
      }
      return null;
    },
  },
  {
    id: "soft_abandoned_cart",
    priority: 30,
    channel: "inline",
    reasonKey: "lifecycle.reasons.softAbandonedCart",
    messageKey: "lifecycle.messages.softAbandonedCart",
    cooldownSeconds: DAY_MS / 1000,
    evaluate(context, referenceTime) {
      if (context.cart.itemsCount === 0 || context.cart.total <= 0) return null;
      if (referenceTime - context.cart.lastUpdatedAt < ABANDONED_CART_THRESHOLD_MS) {
        return null;
      }
      if (hasRecentOrder(context, referenceTime, ABANDONED_CART_THRESHOLD_MS)) {
        return null;
      }
      return {
        itemCount: context.cart.itemsCount,
        total: context.cart.total,
      };
    },
  },
  {
    id: "review_reminder",
    priority: 40,
    channel: "inline",
    reasonKey: "lifecycle.reasons.reviewReminder",
    messageKey: "lifecycle.messages.reviewReminder",
    cooldownSeconds: 7 * DAY_MS / 1000,
    evaluate(context, referenceTime) {
      if (!context.orders.lastOrderAt) return null;
      if (context.reviews.pending === 0) return null;
      const lastOrderMs = new Date(context.orders.lastOrderAt).getTime();
      if (referenceTime - lastOrderMs < REVIEW_REMINDER_DELAY_MS) {
        return null;
      }
      return {
        pending: context.reviews.pending,
        daysSince: toDays(referenceTime - lastOrderMs),
      };
    },
  },
  {
    id: "loyalty_near_threshold",
    priority: 50,
    channel: "banner",
    reasonKey: "lifecycle.reasons.loyaltyThreshold",
    messageKey: "lifecycle.messages.loyaltyThreshold",
    cooldownSeconds: 4 * DAY_MS / 1000,
    evaluate(context) {
      const pointsToNext = context.loyalty.pointsToNext;
      if (pointsToNext == null || pointsToNext > LOYALTY_ALERT_THRESHOLD || pointsToNext <= 0) {
        return null;
      }
      return {
        pointsToNext,
      };
    },
  },
  {
    id: "inactive_since_order",
    priority: 60,
    channel: "silent",
    reasonKey: "lifecycle.reasons.inactiveSinceOrder",
    messageKey: "lifecycle.messages.inactiveSinceOrder",
    cooldownSeconds: 7 * DAY_MS / 1000,
    evaluate(context, referenceTime) {
      if (!context.orders.lastOrderAt) return null;
      const lastOrderMs = new Date(context.orders.lastOrderAt).getTime();
      const delta = referenceTime - lastOrderMs;
      if (delta < INACTIVE_ORDER_THRESHOLD_MS) return null;
      return {
        daysSinceLastOrder: toDays(delta),
      };
    },
  },
];
