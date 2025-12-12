import { getAnalyticsClient } from "./client";
import type { AnalyticsContext } from "@/domain/analytics/AnalyticsClient";
import { getLogger } from "@/logging/globalLogger";

export type ProductViewSource =
  | "shop"
  | "search"
  | "guide"
  | "personalized"
  | "coach"
  | "finder"
  | "favorites"
  | "compare"
  | "product_detail"
  | "onboarding"
  | "planner"
  | "account";

export type BundleViewSource =
  | "landing"
  | "shop"
  | "search"
  | "coach"
  | "finder"
  | "guide"
  | "favorites"
  | "compare"
  | "account"
  | "product_detail";

export type GuideViewSource = "landing" | "guides" | "search" | "favorites" | "compare" | "account";

export type AnalyticsPage =
  | "landing"
  | "shop"
  | "product"
  | "gift_builder"
  | "finder"
  | "coach"
  | "guides"
  | "guide_detail"
  | "account"
  | "checkout"
  | "orders_history"
  | "favorites"
  | "compare"
  | "search"
  | "onboarding";

export type AnalyticsEvent =
  | {
      type: "view_product";
      productId: string;
      variantId?: string;
      source?: ProductViewSource;
    }
  | {
      type: "view_bundle";
      bundleId: string;
      source?: BundleViewSource;
    }
  | {
      type: "view_guide";
      guideId: string;
      source?: GuideViewSource;
    }
  | {
      type: "view_page";
      page: AnalyticsPage;
      extra?: Record<string, unknown>;
    }
  | {
      type: "add_to_cart";
      itemType: "product" | "bundle" | "gift";
      id: string;
      quantity: number;
      price: number;
      variantId?: string;
      source?: ProductViewSource | string;
    }
  | {
      type: "remove_from_cart";
      itemType: "product" | "bundle" | "gift";
      id: string;
      quantity: number;
      variantId?: string;
    }
  | {
      type: "start_checkout";
      subtotal: number;
      itemCount: number;
    }
  | {
      type: "complete_checkout";
      orderId: string;
      subtotal: number;
      total: number;
      itemCount: number;
    }
  | {
      type: "toggle_favorite";
      id: string;
      itemType: "product" | "bundle";
      isFavorite: boolean;
    }
  | {
      type: "toggle_compare";
      id: string;
      itemType: "product" | "bundle";
      isInCompare: boolean;
    }
  | {
      type: "submit_review";
      targetId: string;
      rating: number;
      verified: boolean;
    }
  | {
      type: "update_preferences";
      concerns?: string[];
      time?: string;
      scent?: string;
      budget?: string;
    }
  | {
      type: "finder_completed";
      primaryBundleId?: string;
      productsCount: number;
    }
  | {
      type: "coach_completed";
      primaryBundleId?: string;
      intensity?: string;
    }
  | {
      type: "gift_builder_completed";
      boxId: string;
      productCount: number;
      addonsCount: number;
      totalPrice: number;
    };

type RuntimeEnv = Record<string, string | boolean | undefined>;
const resolvedEnv: RuntimeEnv =
  typeof import.meta !== "undefined" && typeof import.meta.env !== "undefined"
    ? (import.meta.env as RuntimeEnv)
    : (process.env as RuntimeEnv);

const isDevEnvironment =
  resolvedEnv.DEV === true ||
  resolvedEnv.DEV === "true" ||
  resolvedEnv.NODE_ENV === "development";

const ANALYTICS_BUFFER: AnalyticsEvent[] = [];

declare global {
  interface Window {
    __NATURAGLOSS_ANALYTICS_EVENTS__?: AnalyticsEvent[];
    dataLayer?: unknown[];
  }
}

export function trackEvent(event: AnalyticsEvent): void {
  ANALYTICS_BUFFER.push(event);
  if (typeof window !== "undefined") {
    window.__NATURAGLOSS_ANALYTICS_EVENTS__ =
      window.__NATURAGLOSS_ANALYTICS_EVENTS__ ?? [];
    window.__NATURAGLOSS_ANALYTICS_EVENTS__.push(event);
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push(event);
    }
  }

  const { type, ...payload } = event;
  const hasPayload = Object.keys(payload).length > 0;
  const payloadRecord = hasPayload ? (payload as Record<string, unknown>) : undefined;

  const environmentLabel =
    typeof resolvedEnv.NODE_ENV === "string"
      ? resolvedEnv.NODE_ENV
      : isDevEnvironment
      ? "development"
      : "production";

  const context: AnalyticsContext = { metadata: { environment: environmentLabel } };

  getAnalyticsClient().track(type, payloadRecord, context).catch((error) => {
    getLogger().error("[analytics] tracking failed", { error });
  });
}

export function getEventBuffer() {
  return [...ANALYTICS_BUFFER];
}

export function clearEventBuffer() {
  ANALYTICS_BUFFER.length = 0;
}
