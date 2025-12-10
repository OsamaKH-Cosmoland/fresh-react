import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { RefillPlanCreationPanel } from "@/components/refill/RefillPlanCreationPanel";
import { AccountTabs } from "@/components/account/AccountTabs";
import { Button, SectionTitle } from "@/components/ui";
import { useBundleActions } from "@/cart/cartBundles";
import { useCart } from "@/cart/cartStore";
import { useFavorites } from "@/favorites/favoritesStore";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useLocale, useTranslation } from "@/localization/locale";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import {
  shopCatalog,
  shopFocusLookup,
  type FocusTagId,
} from "@/content/shopCatalog";
import { ritualBundles } from "@/content/bundles";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
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
import { CURRENCIES } from "@/currency/currencyConfig";
import { useCurrency } from "@/currency/CurrencyProvider";
import { buildAppUrl } from "@/utils/navigation";
import { useReferralProfile } from "@/referrals/useReferralProfile";
import { GIFT_CREDIT_KEY, listGiftCredits } from "@/utils/giftCreditStorage";
import type { GiftCredit } from "@/giftcards/giftCardTypes";
import {
  deletePlan,
  REFILL_FREQUENCY_OPTIONS,
  type RefillPlan,
  updatePlan,
  useRefillPlans,
} from "@/subscriptions";

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

type AccountTabId =
  | "profile"
  | "orders"
  | "referrals"
  | "saved"
  | "favorites"
  | "reviews"
  | "credits"
  | "refillPlans";

const ACCOUNT_TAB_IDS: AccountTabId[] = [
  "profile",
  "orders",
  "refillPlans",
  "credits",
  "referrals",
  "saved",
  "favorites",
  "reviews",
];

const getInitialAccountTab = () => {
  if (typeof window === "undefined") return "profile";
  const view = new URLSearchParams(window.location.search).get("view");
  if (view && ACCOUNT_TAB_IDS.includes(view as AccountTabId)) {
    return view as AccountTabId;
  }
  return "profile";
};

export default function AccountPage() {
  usePageAnalytics("account");
  useSeo({ route: "account" });
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { currency, setCurrency } = useCurrency();
  const {
    state: ritualPointsState,
    tier: currentTier,
    nextTier,
    pointsToNext,
  } = useRitualPoints();
  const totalPoints = ritualPointsState.totalPoints;
  const lastOrderAt = ritualPointsState.lastOrderAt;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountTabId>(getInitialAccountTab);
  const [orders, setOrders] = useState<LocalOrder[]>(() =>
    typeof window === "undefined" ? [] : readOrders()
  );
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(
    orders[0]?.id ?? null
  );
  const [reviews, setReviews] = useState<LocalReview[]>(() => listReviews());
  const [giftCredits, setGiftCredits] = useState<GiftCredit[]>(() =>
    typeof window === "undefined" ? [] : listGiftCredits()
  );
  const {
    profile: referralProfile,
    attributions: referralAttributions,
    updateProfile: updateReferralProfile,
  } = useReferralProfile();
  const [referralName, setReferralName] = useState(referralProfile.name ?? "");
  const [referralEmail, setReferralEmail] = useState(referralProfile.email ?? "");
  const [referralCopyState, setReferralCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [referralSaveMessage, setReferralSaveMessage] = useState<string | null>(null);
  const referralSaveTimer = useRef<number | null>(null);
  const { preferences } = useUserPreferences();
  const { savedCarts, loadSavedCart, deleteSavedCart, addItem, setCart } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { favorites, toggleFavorite } = useFavorites();
  const { plans: refillPlans, refresh: refreshRefillPlans } = useRefillPlans();

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
    if (typeof window === "undefined") return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === GIFT_CREDIT_KEY) {
        setGiftCredits(listGiftCredits());
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

  useEffect(() => {
    setReferralName(referralProfile.name ?? "");
    setReferralEmail(referralProfile.email ?? "");
  }, [referralProfile.name, referralProfile.email]);

  useEffect(() => {
    return () => {
      if (referralSaveTimer.current) {
        window.clearTimeout(referralSaveTimer.current);
      }
    };
  }, []);

  const tabs = useMemo(
    () => [
      { id: "profile", label: t("account.tabs.profile") },
      { id: "orders", label: t("account.tabs.orders") },
      { id: "refillPlans", label: t("account.tabs.refillPlans") },
      { id: "credits", label: t("account.tabs.credits") },
      { id: "referrals", label: t("account.tabs.referrals") },
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

  const handleReferralCopy = async () => {
    if (!referralLink) return;
    if (typeof navigator === "undefined") {
      setReferralCopyState("error");
      return;
    }
    try {
      await navigator.clipboard.writeText(referralLink);
      setReferralCopyState("copied");
      if (typeof window !== "undefined") {
        window.setTimeout(() => setReferralCopyState("idle"), 2000);
      }
    } catch {
      setReferralCopyState("error");
    }
  };

  const handleReferralSave = () => {
    updateReferralProfile({
      name: referralName.trim() || undefined,
      email: referralEmail.trim() || undefined,
    });
    setReferralSaveMessage(t("account.referrals.form.saved"));
    if (referralSaveTimer.current) {
      window.clearTimeout(referralSaveTimer.current);
    }
    if (typeof window !== "undefined") {
      referralSaveTimer.current = window.setTimeout(
        () => setReferralSaveMessage(null),
        2000
      );
    }
  };

  const referralLink = `${buildAppUrl("/")}?ref=${encodeURIComponent(referralProfile.code)}`;

  const renderProfileTab = () => {
    const tierLabel = t(`account.loyalty.tiers.${currentTier.id}.label`);
    const tierPerks = t(`account.loyalty.tiers.${currentTier.id}.perks`);
    const nextTierLabel = nextTier
      ? t(`account.loyalty.tiers.${nextTier.id}.label`)
      : undefined;

    return (
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
        <div className="account-region">
          <p className="account-region__title">{t("account.region.title")}</p>
          <p className="account-region__description">{t("account.region.description")}</p>
          <div className="account-region__options">
            {CURRENCIES.map((option) => (
              <button
                type="button"
                key={option.code}
                className={`account-region__option${
                  currency === option.code ? " is-active" : ""
                }`}
                onClick={() => setCurrency(option.code)}
              >
                <span>{option.code}</span>
                <small>{option.label}</small>
              </button>
            ))}
          </div>
        </div>
        <div className="account-loyalty-card">
          <div className="account-loyalty-card__header">
            <p className="account-loyalty-card__label">{t("account.loyalty.title")}</p>
            <h3>{tierLabel}</h3>
            <p className="account-loyalty-card__perks">{tierPerks}</p>
          </div>
        <div className="account-loyalty-card__stats">
          <div>
            <span>{t("account.loyalty.totalPoints")}</span>
            <strong>{totalPoints}</strong>
          </div>
          <div>
            <span>{t("account.loyalty.lastOrder")}</span>
            <strong>
              {lastOrderAt
                ? new Date(lastOrderAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </strong>
          </div>
        </div>
        <div className="account-loyalty-card__progress">
          {totalPoints === 0 ? (
            <p>{t("account.loyalty.starting")}</p>
          ) : nextTierLabel && typeof pointsToNext === "number" ? (
            <p>
              {t("account.loyalty.nextTier", {
                points: pointsToNext,
                tier: nextTierLabel,
              })}
            </p>
          ) : (
            <p>{t("account.loyalty.maxTier")}</p>
          )}
        </div>
        </div>
      </div>
    );
  };

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
                  {formatCurrency(order.totals.total, currency)}
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
                            {item.quantity} × {formatCurrency(item.price, currency)}
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
            <div className="account-saved-card__refill">
              <RefillPlanCreationPanel
                title={t("account.saved.refillTitle")}
                description={t("account.saved.refillBody")}
                items={cart.items}
                source="saved"
                label={cart.name}
                startAt={cart.updatedAt}
                buttonLabel={t("account.saved.refillButton")}
                onCreated={refreshRefillPlans}
                className="account-saved-card__refill-panel"
              />
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRefillPlansTab = () => {
    if (!refillPlans.length) {
      return (
        <div className="account-placeholder">
          <h3>{t("account.refillPlans.emptyTitle")}</h3>
          <p>{t("account.refillPlans.emptyBody")}</p>
        </div>
      );
    }

    const handleRefillNow = (plan: RefillPlan) => {
      setCart(plan.items.map((item) => ({ ...item })));
      window.location.href = buildAppUrl("/checkout");
    };

    return (
      <>
        <header className="account-refill-header">
          <h3>{t("account.refillPlans.heading")}</h3>
          <p>{t("account.refillPlans.description")}</p>
        </header>
        <div className="account-refill-grid">
          {refillPlans.map((plan) => (
            <RefillPlanCard
              key={plan.id}
              plan={plan}
              locale={locale}
              onRefresh={refreshRefillPlans}
              onRefillNow={handleRefillNow}
            />
          ))}
        </div>
      </>
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
                    <p>{formatCurrency(detail.priceNumber, currency)}</p>
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
                      <p>{formatCurrency(bundle.bundlePriceNumber, currency)}</p>
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

  const renderReferralsTab = () => {
    const hasAttributions = referralAttributions.length > 0;
    return (
      <div className="account-referrals">
        <header className="account-referrals__hero">
          <h3>{t("account.referrals.heading")}</h3>
          <p>{t("account.referrals.description")}</p>
        </header>
        <div className="account-referrals__link-block">
          <label className="sr-only">{t("account.referrals.linkLabel")}</label>
          <div className="account-referrals__link">
            <input value={referralLink} readOnly />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReferralCopy}
              disabled={!referralLink}
            >
              {t(
                referralCopyState === "copied"
                  ? "account.referrals.copied"
                  : "account.referrals.copyLink"
              )}
            </Button>
          </div>
          {referralCopyState === "error" && (
            <p className="account-referrals__link-error">
              {t("account.referrals.copyError")}
            </p>
          )}
        </div>
        <div className="account-referrals__stats">
          <div>
            <span>{t("account.referrals.stats.orders")}</span>
            <strong>{referralProfile.totalReferredOrders}</strong>
          </div>
          <div>
            <span>{t("account.referrals.stats.credit")}</span>
            <strong>{formatCurrency(referralProfile.totalReferralCreditBase, currency)}</strong>
          </div>
        </div>
        <form
          className="account-referrals__form"
          onSubmit={(event) => {
            event.preventDefault();
            handleReferralSave();
          }}
        >
          <label htmlFor="referralName">{t("account.referrals.form.nameLabel")}</label>
          <input
            id="referralName"
            type="text"
            value={referralName}
            onChange={(event) => setReferralName(event.target.value)}
          />
          <label htmlFor="referralEmail">{t("account.referrals.form.emailLabel")}</label>
          <input
            id="referralEmail"
            type="email"
            value={referralEmail}
            onChange={(event) => setReferralEmail(event.target.value)}
          />
          <div className="account-referrals__form-actions">
            <Button variant="primary" size="md" type="submit">
              {t("account.referrals.form.save")}
            </Button>
            {referralSaveMessage && (
              <p className="account-referrals__form-status" role="status">
                {referralSaveMessage}
              </p>
            )}
          </div>
        </form>
        <div className="account-referrals__list">
          <header>
            <h4>{t("account.referrals.list.title")}</h4>
          </header>
          {hasAttributions ? (
            <ul>
              {referralAttributions.slice(0, 5).map((entry) => (
                <li key={`${entry.orderId}-${entry.attributedAt}`}>
                  <strong>{t("account.referrals.list.orderLabel", { orderId: entry.orderId })}</strong>
                  <p>
                    {new Date(entry.attributedAt).toLocaleDateString(locale, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })} · {formatCurrency(entry.creditAwardedBase, currency)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="account-referrals__list-empty">
              {t("account.referrals.list.empty")}
            </p>
          )}
        </div>
      </div>
    );
  };

  const renderCreditsTab = () => {
    const activeCredits = giftCredits.filter((credit) => credit.remainingAmountBase > 0);
    if (!activeCredits.length) {
      return (
        <div className="account-placeholder">
          <h3>{t("account.credits.emptyTitle")}</h3>
          <p>{t("account.credits.emptyBody")}</p>
        </div>
      );
    }
    return (
      <div className="account-credits">
        <header className="account-credits__header">
          <h3>{t("account.credits.heading")}</h3>
          <p>{t("account.credits.description")}</p>
        </header>
        <ul className="account-credits__list">
          {activeCredits.map((credit) => (
            <li className="account-credits__item" key={credit.id}>
              <div>
                <strong>{credit.code}</strong>
                <p>{t("account.credits.remaining", { amount: formatCurrency(credit.remainingAmountBase, currency) })}</p>
              </div>
              <div className="account-credits__meta">
                <span className="account-credits__status">
                  {t(`account.credits.statuses.${credit.status}`)}
                </span>
                <small>
                  {t("account.credits.createdAt", {
                    date: new Date(credit.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    }),
                  })}
                </small>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const tabContent = (() => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "orders":
        return renderOrdersTab();
      case "refillPlans":
        return renderRefillPlansTab();
      case "referrals":
        return renderReferralsTab();
      case "credits":
        return renderCreditsTab();
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
        menuOpen={sidebarOpen}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" tabIndex={-1} className="ng-mobile-shell">
        <header className="account-hero">
        <SectionTitle
          title={t("account.hero.title")}
          subtitle={t("account.hero.subtitle")}
          align="center"
          as="h1"
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

interface RefillPlanCardProps {
  plan: RefillPlan;
  locale: string;
  onRefresh: () => void;
  onRefillNow: (plan: RefillPlan) => void;
}

function RefillPlanCard({ plan, locale, onRefresh, onRefillNow }: RefillPlanCardProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(plan.label ?? "");

  useEffect(() => {
    setLabel(plan.label ?? "");
  }, [plan.label]);

  const handleLabelCommit = () => {
    const trimmed = label.trim();
    if (trimmed === (plan.label ?? "")) {
      return;
    }
    updatePlan(plan.id, { label: trimmed || null });
    onRefresh();
  };

  const handleFrequencyChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    updatePlan(plan.id, { frequency: value });
    onRefresh();
  };

  const handlePauseResume = () => {
    const nextStatus = plan.status === "active" ? "paused" : "active";
    updatePlan(plan.id, { status: nextStatus });
    onRefresh();
  };

  const handleCancel = () => {
    updatePlan(plan.id, { status: "cancelled" });
    onRefresh();
  };

  const handleDelete = () => {
    deletePlan(plan.id);
    onRefresh();
  };

  const statusLabel = t(`account.refillPlans.statuses.${plan.status}`);
  const frequencyLabel = t(`refillPlans.frequencyLabels.${plan.frequency}`) ?? plan.frequency;
  const nextRefillLabel = plan.nextRefillAt
    ? new Intl.DateTimeFormat(locale, {
        month: "short",
        day: "numeric",
      }).format(new Date(plan.nextRefillAt))
    : t("account.refillPlans.nextRefillNone");

  return (
    <article className="account-refill-card">
      <div className="account-refill-card__header">
        <input
          type="text"
          value={label}
          placeholder={t("account.refillPlans.placeholderLabel")}
          onChange={(event) => setLabel(event.target.value)}
          onBlur={handleLabelCommit}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleLabelCommit();
            }
          }}
        />
        <span className="account-refill-card__status">{statusLabel}</span>
      </div>
      <div className="account-refill-card__meta">
        <p>
          {t("account.refillPlans.frequencyLabel")}: {frequencyLabel}
        </p>
        <p>
          {t("account.refillPlans.nextRefillLabel")}: {nextRefillLabel}
        </p>
        <select
          className="account-refill-card__frequency-select"
          value={plan.frequency}
          onChange={handleFrequencyChange}
        >
          {REFILL_FREQUENCY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </div>
      <div className="account-refill-card__actions">
        <Button variant="secondary" size="sm" onClick={() => onRefillNow(plan)}>
          {t("account.refillPlans.actions.refillNow")}
        </Button>
        <Button variant="ghost" size="sm" onClick={handlePauseResume}>
          {plan.status === "active"
            ? t("account.refillPlans.actions.pause")
            : t("account.refillPlans.actions.resume")}
        </Button>
        {plan.status !== "cancelled" && (
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            {t("account.refillPlans.actions.cancel")}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          {t("account.refillPlans.actions.delete")}
        </Button>
      </div>
    </article>
  );
}
