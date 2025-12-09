import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { readOrders } from "@/utils/orderStorage";
import type { LocalOrder } from "@/types/localOrder";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "@/localization/locale";
import { formatVariantMeta } from "@/utils/variantDisplay";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { useCurrency } from "@/currency/CurrencyProvider";
import { useLoyalty } from "@/loyalty/useLoyalty";

const navigateToPath = (path: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  const destination = new URL(base, window.location.origin);
  destination.pathname = path;
  destination.search = "";
  destination.hash = "";
  window.location.href = destination.toString();
};

const formatLabel = (order: LocalOrder) =>
  `${order.id} · ${new Date(order.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

const formatItemLabel = (item: LocalOrder["items"][number], t: ReturnType<typeof useTranslation>["t"]) => {
  if (item.giftBox) {
    return `${t("ordersHistory.labels.gift")} · ${item.giftBox.styleName}`;
  }
  if (item.bundleId) {
    return `${t("ordersHistory.labels.bundle")} · ${item.name}`;
  }
  return item.name;
};

export default function OrdersHistoryPage() {
  usePageAnalytics("orders_history");
  useSeo({ route: "orders_history" });
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const { totalPoints, currentTier, nextTier, pointsToNextTier } = useLoyalty();
  const currentTierLabel = t(`account.loyalty.tiers.${currentTier.id}.label`);
  const nextTierLabel = nextTier
    ? t(`account.loyalty.tiers.${nextTier.id}.label`)
    : undefined;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const orders = useMemo(() => readOrders(), []);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders[0]?.id ?? null
  );

  return (
    <div className="orders-history-page">
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} menuOpen={drawerOpen} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main id="main-content" tabIndex={-1} className="orders-history-shell ng-mobile-shell">
        <header className="orders-history-hero">
          <SectionTitle
            title={t("ordersHistory.title")}
            subtitle={t("ordersHistory.subtitle")}
            align="center"
            as="h1"
          />
        </header>
        <div className="orders-history-loyalty">
          <p>{t("ordersHistory.loyalty.label")}</p>
          <strong>
            {t("ordersHistory.loyalty.status", { tier: currentTierLabel })}
          </strong>
          <p>{t("ordersHistory.loyalty.points", { points: totalPoints })}</p>
          {nextTierLabel && typeof pointsToNextTier === "number" ? (
            <p>
              {t("ordersHistory.loyalty.nextTier", {
                points: pointsToNextTier,
                tier: nextTierLabel,
              })}
            </p>
          ) : (
            <p>{t("ordersHistory.loyalty.maxTier")}</p>
          )}
        </div>

        {orders.length === 0 ? (
          <section className="orders-history-empty">
            <p>{t("ordersHistory.empty")}</p>
            <Button variant="primary" size="md" onClick={() => navigateToPath("/checkout")}>
              {t("checkout.cta.start")}
            </Button>
          </section>
        ) : (
          <section className="orders-history-list">
            <div className="orders-history-grid">
              {orders.map((order) => (
                <Card key={order.id} className="orders-history-card">
                  <div className="orders-history-card__head">
                    <p className="orders-history-card__code">
                      {t("ordersHistory.labels.orderId")} {order.id}
                    </p>
                    <p className="orders-history-card__meta">{formatLabel(order)}</p>
                    <p className="orders-history-card__total">
                      {formatCurrency(order.totals.total, currency)}
                    </p>
                    <p className="orders-history-card__items">
                      {t("ordersHistory.labels.itemCount", {
                        count: order.items.reduce((sum, item) => sum + item.quantity, 0),
                      })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setExpandedOrderId((prev) => (prev === order.id ? null : order.id))
                      }
                    >
                      {expandedOrderId === order.id
                        ? t("ordersHistory.labels.hide")
                        : t("ordersHistory.labels.view")}
                    </Button>
                  </div>
                  {expandedOrderId === order.id && (
                  <div className="orders-history-card__details">
                    <div>
                      <strong>{t("ordersHistory.detail.shippingMethod")}</strong>
                      <p>{order.shippingMethod.label}</p>
                      <p className="orders-history-card__eta">{order.shippingMethod.eta}</p>
                    </div>
                    <div>
                      <strong>{t("ordersHistory.detail.address")}</strong>
                      <p>{order.shippingAddress.street}</p>
                      <p>
                        {order.shippingAddress.city} · {order.shippingAddress.country}
                      </p>
                      {order.shippingAddress.postalCode && (
                        <p>{order.shippingAddress.postalCode}</p>
                      )}
                    </div>
                    <div>
                      <strong>{t("ordersHistory.detail.payment")}</strong>
                      <p>{order.paymentSummary.methodLabel}</p>
                      {order.paymentSummary.last4 && (
                        <small>
                          {t("ordersHistory.detail.last4", { last4: order.paymentSummary.last4 })}
                        </small>
                      )}
                    </div>
                    {order.totals.discountTotal > 0 && (
                      <div>
                        <strong>{t("ordersHistory.detail.discount")}</strong>
                        <p>{formatCurrency(order.totals.discountTotal, currency)}</p>
                      </div>
                    )}
                    {order.promoCode && (
                      <div>
                        <strong>{t("ordersHistory.detail.promoCode")}</strong>
                        <p>{order.promoCode}</p>
                      </div>
                    )}
                    <div>
                      <strong>{t("ordersHistory.detail.items")}</strong>
                          <ul className="orders-history-card__item-list">
                            {order.items.map((item) => {
                              const itemVariant = formatVariantMeta(
                                item.variantLabel,
                                item.variantAttributes
                              );
                              return (
                                <li key={`${order.id}-${item.id}`}>
                                  <div>
                                    <span>{formatItemLabel(item, t)}</span>
                                    {itemVariant && (
                                      <p className="orders-history-card__variant">{itemVariant}</p>
                                    )}
                                    {item.bundleItems && item.bundleItems.length > 0 && (
                                      <ul className="orders-history-card__sub-items">
                                        {item.bundleItems.map((bundleItem) => {
                                          const bundleVariant = formatVariantMeta(
                                            bundleItem.variantLabel,
                                            bundleItem.variantAttributes
                                          );
                                          return (
                                            <li key={`${item.bundleId}-${bundleItem.productId}`}>
                                              <span>
                                                {bundleItem.name} × {bundleItem.quantity}
                                              </span>
                                              {bundleVariant && (
                                                <small className="orders-history-card__sub-meta">
                                                  {bundleVariant}
                                                </small>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                    {item.giftBox?.items && item.giftBox.items.length > 0 && (
                                      <ul className="orders-history-card__sub-items">
                                        {item.giftBox.items.map((giftItem) => {
                                          const giftVariant = formatVariantMeta(
                                            giftItem.variantLabel,
                                            giftItem.variantAttributes
                                          );
                                          return (
                                            <li key={`${item.id}-${giftItem.productId}`}>
                                              <span>{giftItem.name}</span>
                                              {giftVariant && (
                                                <small className="orders-history-card__sub-meta">
                                                  {giftVariant}
                                                </small>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    )}
                                  </div>
                                  <span>
                                    {item.quantity} × {formatCurrency(item.price, currency)}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
