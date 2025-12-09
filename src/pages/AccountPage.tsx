import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { AccountTabs } from "@/components/account/AccountTabs";
import { Button, SectionTitle } from "@/components/ui";
import { useBundleActions } from "@/cart/cartBundles";
import { useCart } from "@/cart/cartStore";
import { useFavorites } from "@/favorites/favoritesStore";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useTranslation } from "@/localization/locale";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import {
  shopCatalog,
  shopFocusLookup,
  type FocusTagId,
} from "@/content/shopCatalog";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { ritualBundles } from "@/content/bundles";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { formatCurrency } from "@/utils/formatCurrency";
import { formatVariantMeta } from "@/utils/variantDisplay";
import { readOrders, ORDER_STORAGE_KEY } from "@/utils/orderStorage";
import {
  listReviews,
  getReviewStats,
  REVIEW_STORAGE_KEY,
} from "@/utils/reviewStorage";
import { isTargetVerifiedForAnyOrder } from "@/utils/reviewVerification";
import { RatingBadge } from "@/components/reviews/RatingBadge";
import type { LocalOrder } from "@/types/localOrder";
import type { LocalReview } from "@/types/localReview";
import { useSeo } from "@/seo/useSeo";

const buildAppUrl = (pathname: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${normalizedBase}${normalizedPath}`;
};

const formatOrderLabel = (order: LocalOrder) =>
  `${order.id} · ${new Date(order.createdAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

const formatItemLabel = (
  item: LocalOrder["items"][number],
  t: ReturnType<typeof useTranslation>["t"]
) => {
  if (item.giftBox) {
    return `${t("ordersHistory.labels.gift")} · ${item.giftBox.styleName}`;
  }
  if (item.bundleId) {
    return `${t("ordersHistory.labels.bundle")} · ${item.name}`;
  }
  return item.name;
};

const formatSavedDate = (value: string) =>
  new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const ratingStars = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => (index < rating ? "★" : "☆")).join("");

const getReviewTargetInfo = (review: LocalReview) => {
  if (review.type === "product") {
    const detail = PRODUCT_DETAIL_MAP[review.targetId];
    return {
      label: detail?.productName ?? review.targetId,
      url: detail ? buildAppUrl(`/products/${detail.slug}`) : buildAppUrl("/shop"),
    };
  }
  const bundle = ritualBundles.find((entry) => entry.id === review.targetId);
  return {
    label: bundle?.name ?? review.targetId,
    url: buildAppUrl("/shop"),
  };
};

type AccountTabId = "profile" | "orders" | "saved" | "favorites" | "reviews";

export default function AccountPage() {
  usePageAnalytics("account");
  useSeo({ route: "account" });
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTabId>("profile");
  const [orders, setOrders] = useState<LocalOrder[]>(() =>
    typeof window === "undefined" ? [] : readOrders()
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders[0]?.id ?? null
  );
  const [reviews, setReviews] = useState<LocalReview[]>(() => listReviews());
  const { preferences } = useUserPreferences();
  const { savedCarts, loadSavedCart, deleteSavedCart, addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { favorites, toggleFavorite } = useFavorites();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_STORAGE_KEY) {
        setOrders(readOrders());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === REVIEW_STORAGE_KEY) {
        setReviews(listReviews());
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!orders.length) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId((prev) =>
      prev && orders.some((order) => order.id === prev) ? prev : orders[0].id
    );
  }, [orders]);

  const tabs = useMemo(
    () => [
      { id: "profile", label: t("account.tabs.profile") },
      { id: "orders", label: t("account.tabs.orders") },
      { id: "saved", label: t("account.tabs.saved") },
      { id: "favorites", label: t("account.tabs.favorites") },
      { id: "reviews", label: t("account.tabs.reviews") },
    ],
    [t]
  );

  const focusMap = useMemo(
    () =>
      shopCatalog.reduce<Record<string, FocusTagId[]>>((acc, entry) => {
        if (entry.kind === "product") {
          acc[entry.item.productId] = entry.focus;
        } else {
          acc[entry.item.id] = entry.focus;
        }
        return acc;
      }, {}),
    []
  );

  const focusLabels = (ids: FocusTagId[] = []) =>
    ids.map((id) => shopFocusLookup[id]).filter(Boolean);

  const preferenceFocus =
    preferences?.concerns
      ?.map((concern) => t(`onboarding.options.concerns.${concern}.label`))
      .filter(Boolean) ?? [];
  const timePreference = preferences?.timePreference
    ? t(`onboarding.options.time.${preferences.timePreference}.label`)
    : t("account.profile.emptyValue");
  const scentPreference = preferences?.scentPreference
    ? t(`onboarding.options.scent.${preferences.scentPreference}.label`)
    : t("account.profile.emptyValue");
  const budgetPreference = preferences?.budgetPreference
    ? t(`onboarding.options.budget.${preferences.budgetPreference}.label`)
    : t("account.profile.emptyValue");

  const favoriteProducts = useMemo(
    () =>
      favorites
        .filter((entry) => entry.type === "product")
        .map((entry) => PRODUCT_DETAIL_MAP[entry.id])
        .filter((detail): detail is typeof PRODUCT_DETAIL_MAP[string] => Boolean(detail)),
    [favorites]
  );

  const favoriteBundles = useMemo(
    () =>
      favorites
        .filter((entry) => entry.type === "bundle")
        .map((entry) => ritualBundles.find((bundle) => bundle.id === entry.id))
        .filter((bundle): bundle is typeof ritualBundles[number] => Boolean(bundle)),
    [favorites]
  );

  const handleFavoriteProductAdd = (detail: typeof favoriteProducts[number]) => {
    const payload = buildProductCartPayload(detail);
    addItem(payload);
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: detail.productId,
      quantity: 1,
      price: payload.price,
      variantId: payload.variantId,
      source: "account",
    });
  };

  const hasFavorites = favoriteProducts.length > 0 || favoriteBundles.length > 0;
  const hasOrders = orders.length > 0;
  const hasSavedCarts = savedCarts.length > 0;
  const hasReviews = reviews.length > 0;

  const navigateTo = (path: string) => {
    if (typeof window === "undefined") return;
    window.location.href = buildAppUrl(path);
  };

  const renderProfileTab = () => (
    <div className="account-card">
      <dl className="account-profile-grid">
        <div>
          <dt>{t("account.profile.focusLabel")}</dt>
          <dd>
            {preferenceFocus.length ? preferenceFocus.join(" · ") : t("account.profile.emptyValue")}
          </dd>
        </div>
        <div>
          <dt>{t("account.profile.timeLabel")}</dt>
          <dd>{timePreference}</dd>
        </div>
        <div>
          <dt>{t("account.profile.scentLabel")}</dt>
          <dd>{scentPreference}</dd>
        </div>
        <div>
          <dt>{t("account.profile.budgetLabel")}</dt>
          <dd>{budgetPreference}</dd>
        </div>
      </dl>
      <p className="account-profile-hint">{t("account.profile.hint")}</p>
      <div className="account-actions">
        <Button variant="secondary" size="md" onClick={() => navigateTo("/onboarding")}>
          {t("account.profile.edit")}
        </Button>
      </div>
    </div>
  );

  const renderOrdersTab = () => {
    if (!hasOrders) {
      return (
        <div className="account-placeholder">
          <h3>{t("account.orders.emptyTitle")}</h3>
          <p>{t("account.orders.emptyBody")}</p>
        </div>
      );
    }

    return (
      <div className="account-grid">
        {orders.map((order) => (
          <div className="account-order-card" key={order.id}>
            <div className="account-order-card__header">
              <div>
                <p className="account-order-card__meta">
                  {t("ordersHistory.labels.orderId")} {order.id}
                </p>
                <p className="account-order-card__meta">{formatOrderLabel(order)}</p>
                <p className="account-order-card__meta">
                  {formatCurrency(order.totals.total)}
                </p>
              </div>
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
              <div className="account-order-card__details">
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
                      {t("ordersHistory.detail.last4", {
                        last4: order.paymentSummary.last4,
                      })}
                    </small>
                  )}
                </div>
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
                                    <li
                                      key={`${item.bundleId}-${bundleItem.productId}`}
                                    >
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
                            {item.quantity} × {formatCurrency(item.price)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderSavedTab = () => {
    if (!hasSavedCarts) {
      return (
        <div className="account-placeholder">
          <p>{t("account.saved.empty")}</p>
        </div>
      );
    }

    return (
      <div className="account-grid">
        {savedCarts.map((cart) => (
          <div className="account-saved-card" key={cart.id}>
            <h3>{cart.name}</h3>
            <p className="account-order-card__meta">
              {t("ordersHistory.labels.itemCount", { count: cart.items.length })} ·{" "}
              {formatSavedDate(cart.updatedAt)}
            </p>
            <div className="account-actions">
              <Button
                variant="primary"
                size="sm"
                onClick={() => loadSavedCart(cart.id)}
              >
                {t("account.saved.load")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteSavedCart(cart.id)}
              >
                {t("account.saved.delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderFavoritesTab = () => (
    <>
      {!hasFavorites && (
        <div className="account-placeholder">
          <p>{t("account.favorites.empty")}</p>
        </div>
      )}

      {favoriteProducts.length > 0 && (
        <section className="account-grid">
          <header>
            <h3>{t("account.favorites.products")}</h3>
          </header>
          {favoriteProducts.map((detail) => {
            const stats = getReviewStats(detail.productId, "product");
            return (
              <div className="account-favorite-card" key={detail.productId}>
                {detail.heroImage && (
                  <img
                    src={detail.heroImage}
                    alt={detail.productName}
                    className="account-favorite-card__photo"
                  />
                )}
                <div>
                  <div className="account-favorite-card__heading">
                    <h3>{detail.productName}</h3>
                    <p>{detail.priceLabel}</p>
                  </div>
                  <p className="account-favorite-card__tagline">{detail.shortTagline}</p>
                  <RatingBadge average={stats.average} count={stats.count} />
                  {focusLabels(focusMap[detail.productId] ?? []).length > 0 && (
                    <div className="shop-product-card__chips">
                      {focusLabels(focusMap[detail.productId] ?? []).map((label) => (
                        <span
                          key={`fav-focus-${detail.productId}-${label}`}
                          className="shop-product-card__chip shop-product-card__chip--focus"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="account-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleFavoriteProductAdd(detail)}
                    >
                      {t("cta.addToBag")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        toggleFavorite({ id: detail.productId, type: "product" })
                      }
                    >
                      {t("account.favorites.remove")}
                    </Button>
                  </div>
                  <div>
                    <a
                      className="account-favorite-card__link"
                      href={buildAppUrl(`/products/${detail.slug}`)}
                    >
                      {t("cta.viewRitual")}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {favoriteBundles.length > 0 && (
        <section className="account-grid">
          <header>
            <h3>{t("account.favorites.bundles")}</h3>
          </header>
          {favoriteBundles.map((bundle) => {
            const stats = getReviewStats(bundle.id, "bundle");
            const focusChips = focusLabels(focusMap[bundle.id] ?? []);
            return (
              <div className="account-favorite-card" key={bundle.id}>
                <div>
                  <div className="account-favorite-card__heading">
                    <h3>{bundle.name}</h3>
                    <p>{bundle.bundlePriceLabel ?? formatCurrency(bundle.bundlePriceNumber)}</p>
                  </div>
                  <p className="account-favorite-card__tagline">{bundle.tagline}</p>
                  <RatingBadge average={stats.average} count={stats.count} />
                  {focusChips.length > 0 && (
                    <div className="shop-product-card__chips">
                      {focusChips.map((label) => (
                        <span
                          key={`fav-bundle-focus-${bundle.id}-${label}`}
                          className="shop-product-card__chip shop-product-card__chip--focus"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="account-actions">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => addBundleToCart(bundle)}
                    >
                      {t("cta.addToBag")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite({ id: bundle.id, type: "bundle" })}
                    >
                      {t("account.favorites.remove")}
                    </Button>
                  </div>
                  <div>
                    <a className="account-favorite-card__link" href={buildAppUrl("/shop")}>
                      {t("cta.viewRitual")}
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </>
  );

  const renderReviewsTab = () => {
    if (!hasReviews) {
      return (
        <div className="account-placeholder">
          <p>{t("account.reviews.empty")}</p>
        </div>
      );
    }

    return (
      <div className="account-grid">
        <header>
          <h3>{t("account.reviews.heading")}</h3>
        </header>
        {reviews.map((review) => {
          const target = getReviewTargetInfo(review);
          const verified = isTargetVerifiedForAnyOrder(review.targetId, review.type);
          const reviewDate = new Date(review.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          });
          return (
            <div className="account-review-card" key={review.id}>
              <div className="account-review-card__meta">
                <span aria-hidden="true">{ratingStars(review.rating)}</span>
                <span>{reviewDate}</span>
                {verified && <span>{t("account.reviews.verifiedLabel")}</span>}
              </div>
              <h3>{target.label}</h3>
              {review.title && <p className="account-review-card__title">{review.title}</p>}
              <p>{review.body}</p>
              {review.photoUrl && (
                <img
                  src={review.photoUrl}
                  alt={t("reviews.list.photoAlt")}
                  className="account-review-card__photo"
                />
              )}
              <div className="account-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateTo(target.url)}
                >
                  {t("cta.viewRitual")}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabContent = (() => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "orders":
        return renderOrdersTab();
      case "saved":
        return renderSavedTab();
      case "favorites":
        return renderFavoritesTab();
      case "reviews":
        return renderReviewsTab();
      default:
        return null;
    }
  })();

  return (
    <div className="account-page">
      <Navbar
        sticky
        showSectionLinks={false}
        compactSearch
        onMenuToggle={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="ng-mobile-shell">
        <header className="account-hero">
          <SectionTitle
            title={t("account.hero.title")}
            subtitle={t("account.hero.subtitle")}
            align="center"
          />
        </header>
        <AccountTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <section
          className="account-panel"
          role="tabpanel"
          id={`account-panel-${activeTab}`}
          aria-labelledby={`account-tab-${activeTab}`}
        >
          {tabContent}
        </section>
      </main>
    </div>
  );
}
