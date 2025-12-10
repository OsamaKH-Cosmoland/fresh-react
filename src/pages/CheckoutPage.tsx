import { useMemo, useState, type KeyboardEvent } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Button, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { addOrder } from "@/utils/orderStorage";
import type { LocalOrder, ShippingMethod } from "@/types/localOrder";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import { formatVariantMeta } from "@/utils/variantDisplay";
import {
  buildNotificationItems,
  notifyOrderCreated,
} from "@/utils/orderNotifications";
import { submitOrderToApi } from "@/utils/orderApi";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { upsertAudienceContact } from "@/utils/audienceStorage";
import PromoCodePanel from "@/components/promo/PromoCodePanel";
import { useCurrency } from "@/currency/CurrencyProvider";
import { calculatePointsForOrder } from "@/loyalty/loyaltyEngine";
import { addPoints } from "@/utils/loyaltyStorage";
import { useLoyalty } from "@/loyalty/useLoyalty";
import { buildAppUrl } from "@/utils/navigation";
import { useReferralProfile } from "@/referrals/useReferralProfile";
import { loadLastAttributionCode } from "@/referrals/referralAttribution";
import {
  addReferralAttribution,
  ensureReferralProfile,
  saveReferralProfile,
} from "@/utils/referralStorage";
import { createManualGiftCredit } from "@/utils/giftCreditStorage";
import {
  applyCreditToAmount,
  createGiftCreditFromOrder,
  findCreditByCode,
  listGiftCredits,
  saveGiftCredits,
} from "@/utils/giftCreditStorage";
import { isGiftCardProduct } from "@/giftcards/giftCardCatalog";

const SHIPPING_OPTIONS = [
  { id: "standard", cost: 45 },
  { id: "express", cost: 90 },
  { id: "local", cost: 35 },
] as const;

const STEPS: AppTranslationKey[] = [
  "checkout.steps.contact",
  "checkout.steps.shipping",
  "checkout.steps.payment",
  "checkout.steps.review",
];

const PAYMENT_METHODS = [
  { id: "card", labelKey: "checkout.payment.methods.card" as AppTranslationKey },
  { id: "cod", labelKey: "checkout.payment.methods.cod" as AppTranslationKey },
];

const generateOrderId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `NG-${Date.now().toString(36).toUpperCase()}`;

const EMPTY_CONTACT = {
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  street: "",
  postalCode: "",
};

export default function CheckoutPage() {
  usePageAnalytics("checkout");
  useSeo({ route: "checkout" });
  const { locale } = useLocale();
  const { t } = useTranslation();
  const {
    cartItems,
    subtotal,
    discountTotal,
    appliedPromo,
    clearCart,
    creditAppliedBase,
    giftCreditCode,
    giftCreditAppliedAmountBase,
  } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [contactInfo, setContactInfo] = useState(EMPTY_CONTACT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedShippingId, setSelectedShippingId] = useState(SHIPPING_OPTIONS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "" });
  const [orderPlaced, setOrderPlaced] = useState<LocalOrder | null>(null);
  const [createdGiftCredits, setCreatedGiftCredits] = useState<
    { code: string; amountBase: number }[]
  >([]);
  const { isOnline } = useNetworkStatus();
  const [keepUpdated, setKeepUpdated] = useState(false);
  const { currency } = useCurrency();
  const {
    currentTier,
    nextTier,
    pointsToNextTier,
    totalPoints,
    refresh: refreshLoyalty,
  } = useLoyalty();
  const currentTierLabel = t(`account.loyalty.tiers.${currentTier.id}.label`);
  const nextTierLabel = nextTier
    ? t(`account.loyalty.tiers.${nextTier.id}.label`)
    : undefined;
  const [pointsEarned, setPointsEarned] = useState(0);
  const { profile: referralProfile } = useReferralProfile();
  const [referralCopyState, setReferralCopyState] = useState<"idle" | "copied" | "error">("idle");


  const hasCartItems = cartItems.length > 0;
  const shippingMethod = useMemo<ShippingMethod>(() => {
    const base = SHIPPING_OPTIONS.find((entry) => entry.id === selectedShippingId) ?? SHIPPING_OPTIONS[0];
    return {
      id: base.id,
      cost: base.cost,
      label: t(`checkout.shippingOptions.${base.id}.label` as AppTranslationKey),
      description: t(
        `checkout.shippingOptions.${base.id}.description` as AppTranslationKey
      ),
      eta: t(`checkout.shippingOptions.${base.id}.eta` as AppTranslationKey),
    };
  }, [selectedShippingId, t]);
  const shippingCost = shippingMethod?.cost ?? 0;
  const finalShippingCost = appliedPromo?.freeShipping ? 0 : shippingCost;
  const discountedSubtotal = Math.max(subtotal - discountTotal, 0);
  const total = discountedSubtotal + finalShippingCost;
  const totalAfterCredit = Math.max(total - creditAppliedBase, 0);

  const referralLink = referralProfile
    ? `${buildAppUrl("/")}?ref=${encodeURIComponent(referralProfile.code)}`
    : null;

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

  const handleContactChange = (field: keyof typeof contactInfo, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const validateContact = () => {
    const requiredFields: (keyof typeof contactInfo)[] = ["fullName", "email", "city", "street"];
    const nextErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (!contactInfo[field].trim()) {
        nextErrors[field] = t("checkout.validation.required");
      }
    });
    if (contactInfo.email && !contactInfo.email.includes("@")) {
      nextErrors.email = t("checkout.validation.emailInvalid");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validatePayment = () => {
    if (paymentMethod !== "card") return true;
    const nextErrors: Record<string, string> = {};
    if (cardData.number.replace(/\s+/g, "").length !== 16) {
      nextErrors.number = t("checkout.validation.cardNumber");
    }
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) {
      nextErrors.expiry = t("checkout.validation.cardExpiry");
    }
    if (!/^\d{3,4}$/.test(cardData.cvc)) {
      nextErrors.cvc = t("checkout.validation.cardCvc");
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!validateContact()) return;
    }
    if (currentStep === 2) {
      if (!validatePayment()) return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCardInput = (field: keyof typeof cardData, value: string) => {
    setCardData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleShippingKeyDown = (event: KeyboardEvent<HTMLButtonElement>, optionId: string) => {
    const currentIndex = SHIPPING_OPTIONS.findIndex((option) => option.id === optionId);
    if (currentIndex === -1) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % SHIPPING_OPTIONS.length;
      setSelectedShippingId(SHIPPING_OPTIONS[nextIndex].id);
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + SHIPPING_OPTIONS.length) % SHIPPING_OPTIONS.length;
      setSelectedShippingId(SHIPPING_OPTIONS[prevIndex].id);
    }
  };

  const generateGiftCardCode = () =>
    `NG-${Math.random().toString(36).slice(2, 5).toUpperCase()}-${Math.random()
      .toString(36)
      .slice(2, 5)
      .toUpperCase()}`;

  const createGiftCreditsFromOrder = (order: LocalOrder) => {
    const records: { code: string; amountBase: number }[] = [];
    order.items.forEach((item) => {
      if (!isGiftCardProduct(item.productId)) return;
      const unitPrice = item.price;
      for (let index = 0; index < item.quantity; index += 1) {
        const code = generateGiftCardCode();
        const credit = createGiftCreditFromOrder({
          code,
          amountBase: unitPrice,
          orderId: order.id,
          note: item.name,
        });
        records.push({ code: credit.code, amountBase: credit.initialAmountBase });
      }
    });
    return records;
  };

  const placeOrder = () => {
    if (!isOnline) return;
    if (!hasCartItems || !shippingMethod) return;
    setCreatedGiftCredits([]);
    const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const orderId = generateOrderId();
    const createdAt = new Date().toISOString();
    const subtotalBase = Number(subtotal.toFixed(2));
    const referralCode = loadLastAttributionCode();
    const referralProfileInstance = ensureReferralProfile();
    let referralCreditAwardedBase = 0;
    if (referralCode) {
      const now = new Date().toISOString();
      if (referralCode === referralProfileInstance.code) {
        const awardBase = Math.floor(subtotalBase * 0.1);
        if (awardBase > 0) {
          const referralCreditCode = `REF-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          createManualGiftCredit({
            code: referralCreditCode,
            amountBase: awardBase,
            source: "referral_bonus",
            orderId,
            note: `Referral bonus for order ${orderId}`,
          });
          referralCreditAwardedBase = awardBase;
          saveReferralProfile({
            ...referralProfileInstance,
            totalReferredOrders: referralProfileInstance.totalReferredOrders + 1,
            totalReferralCreditBase: referralProfileInstance.totalReferralCreditBase + awardBase,
          });
        }
      }
      addReferralAttribution({
        code: referralCode,
        attributedAt: now,
        orderId,
        orderTotalBase: subtotalBase,
        creditAwardedBase: referralCreditAwardedBase,
      });
    }
    const orderTotalBeforeCredit = total;
    let finalGiftCreditAmount = 0;
    let finalGiftCreditCode: string | undefined;
    if (giftCreditCode && creditAppliedBase > 0) {
      const storedCredit = findCreditByCode(giftCreditCode);
      if (storedCredit) {
        const { appliedAmountBase, updatedCredit } = applyCreditToAmount(
          storedCredit,
          orderTotalBeforeCredit
        );
        if (appliedAmountBase > 0) {
          finalGiftCreditAmount = appliedAmountBase;
          finalGiftCreditCode = storedCredit.code;
          const updatedList = listGiftCredits().map((entry) =>
            entry.code === updatedCredit.code ? updatedCredit : entry
          );
          saveGiftCredits(updatedList);
        }
      }
    }
    const finalGiftCreditAmountBase = Number(finalGiftCreditAmount.toFixed(2));
    const finalOrderTotal = Math.max(orderTotalBeforeCredit - finalGiftCreditAmountBase, 0);
    const order: LocalOrder = {
      id: orderId,
      createdAt,
      items: cartItems.map((item) => ({ ...item })),
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        discountTotal: Number(discountTotal.toFixed(2)),
        shippingCost: Number(finalShippingCost.toFixed(2)),
        total: Number(finalOrderTotal.toFixed(2)),
        currency: "EGP",
      },
      promoCode: appliedPromo?.code ?? undefined,
      customer: {
        name: contactInfo.fullName.trim(),
        email: contactInfo.email.trim(),
        phone: contactInfo.phone.trim() || undefined,
      },
      shippingAddress: {
        country: contactInfo.country.trim() || t("checkout.defaults.country"),
        city: contactInfo.city.trim(),
        street: contactInfo.street.trim(),
        postalCode: contactInfo.postalCode.trim(),
      },
      shippingMethod,
      paymentSummary: {
        methodLabel: t(`checkout.payment.methods.${paymentMethod}` as AppTranslationKey),
        last4:
          paymentMethod === "card" && cardData.number
            ? cardData.number.replace(/\s+/g, "").slice(-4)
            : undefined,
        status: "simulated",
      },
      giftCreditCode: finalGiftCreditAmountBase > 0 ? finalGiftCreditCode : undefined,
      giftCreditAppliedAmountBase:
        finalGiftCreditAmountBase > 0 ? finalGiftCreditAmountBase : undefined,
    };
    addOrder(order);
    trackEvent({
      type: "complete_checkout",
      orderId,
      subtotal: order.totals.subtotal,
      total: order.totals.total,
      itemCount,
    });
    clearCart();
    const newGiftCredits = createGiftCreditsFromOrder(order);
    setCreatedGiftCredits(newGiftCredits);
    setOrderPlaced(order);
    setCurrentStep(STEPS.length - 1);
    void submitOrderToApi(order);
    if (order.customer.email) {
      void notifyOrderCreated({
        orderId: order.id,
        orderNumber: order.id,
        email: order.customer.email,
        total: order.totals.total,
        currency: order.totals.currency,
        items: buildNotificationItems(order.items),
        customerName: order.customer.name,
        phone: order.customer.phone,
        shippingMethod: order.shippingMethod.label,
        shippingAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
      });
    }
    const earnedPoints = calculatePointsForOrder(order.totals.subtotal);
    setPointsEarned(earnedPoints);
    if (earnedPoints > 0) {
      try {
        addPoints(earnedPoints, order.createdAt);
        refreshLoyalty();
        trackEvent({
          type: "loyalty_points_awarded",
          points: earnedPoints,
        });
      } catch (loyaltyError) {
        console.warn("Unable to save loyalty points", loyaltyError);
      }
    }
    if (order.customer.email && keepUpdated) {
      try {
        upsertAudienceContact({
          email: order.customer.email,
          locale,
          consentsToAdd: [
            { channel: "product_updates", source: "checkout" },
            { channel: "offers", source: "checkout" },
          ],
          lastOrderAt: order.createdAt,
        });
      } catch (error) {
        console.warn("Unable to capture audience contact from checkout", error);
      }
    }
  };

  const navigateToAppPath = (path: string) => {
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = path;
    destination.search = "";
    destination.hash = "";
    window.location.href = destination.toString();
  };

const renderContactField = (name: keyof typeof contactInfo, labelKey: AppTranslationKey, required = false) => {
  const errorId = `${name}-error`;
  return (
    <div className="checkout-field">
      <label htmlFor={name}>
        {t(labelKey)}
        {required && <span className="checkout-required"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        value={contactInfo[name]}
        onChange={(event) => handleContactChange(name, event.target.value)}
        className="checkout-input"
        aria-invalid={errors[name] ? "true" : undefined}
        aria-describedby={errors[name] ? errorId : undefined}
      />
      {errors[name] && (
        <p id={errorId} className="checkout-error">
          {errors[name]}
        </p>
      )}
    </div>
  );
};

const renderItemLabel = (item: typeof cartItems[number]) => {
  if (item.giftBox) {
    return `${t("checkout.review.labels.gift")} · ${item.giftBox.styleName}`;
  }
  if (item.bundleId) {
    return `${t("checkout.review.labels.bundle")} · ${item.name}`;
  }
  return item.name;
};

  return (
    <div className="checkout-page">
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} menuOpen={drawerOpen} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main id="main-content" tabIndex={-1} className="checkout-shell ng-mobile-shell">
        <header className="checkout-hero" data-animate="fade-up">
        <SectionTitle
          title={t("checkout.hero.title")}
          subtitle={t("checkout.hero.subtitle")}
          align="center"
          as="h1"
        />
          <p className="checkout-hero__meta">{t("checkout.hero.meta")}</p>
          {!isOnline && (
            <p className="checkout-offline" role="status">
              {t("offline.checkoutWarning")}
            </p>
          )}
        </header>

        {!hasCartItems && !orderPlaced ? (
          <section className="checkout-empty">
            <SectionTitle title={t("checkout.empty.title")} align="center" />
            <p>{t("checkout.empty.body")}</p>
            <div className="checkout-empty__actions">
              <Button
                variant="primary"
                size="md"
                onClick={() => navigateToAppPath("/")}
              >
                {t("cta.browseShop")}
              </Button>
            </div>
          </section>
        ) : orderPlaced ? (
          <section className="checkout-confirmation">
            <SectionTitle title={t("checkout.confirmation.title")} align="center" />
            <p className="checkout-confirmation__copy">
              {t("checkout.confirmation.subtitle")}
            </p>
            <div className="checkout-confirmation__code">
              <strong>{orderPlaced.id}</strong>
              <span>
                {new Date(orderPlaced.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <div className="checkout-confirmation__summary">
              <p>
                {t("checkout.confirmation.summary", {
                  itemCount: orderPlaced.items.reduce((sum, item) => sum + item.quantity, 0),
                  total: formatCurrency(orderPlaced.totals.total, currency),
                })}
              </p>
            </div>
            {createdGiftCredits.length > 0 && (
              <div className="checkout-confirmation__gift-codes">
                <h4>{t("checkout.confirmation.giftCodesTitle")}</h4>
                <p>{t("checkout.confirmation.keepCodesSafe")}</p>
                <ul>
                  {createdGiftCredits.map((credit) => (
                    <li key={credit.code}>
                      <strong>{credit.code}</strong>
                      <span>{formatCurrency(credit.amountBase, currency)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {orderPlaced.giftCreditAppliedAmountBase && orderPlaced.giftCreditCode && (
              <p className="checkout-confirmation__credit-note">
                {t("checkout.confirmation.creditUsed", {
                  amount: formatCurrency(orderPlaced.giftCreditAppliedAmountBase, currency),
                  code: orderPlaced.giftCreditCode,
                })}
              </p>
            )}
            <div className="checkout-confirmation__loyalty">
              <p>{t("checkout.confirmation.loyaltyEarned", { points: pointsEarned })}</p>
              <p>{t("checkout.confirmation.loyaltyStatus", { tier: currentTierLabel })}</p>
              <p>{t("checkout.confirmation.loyaltyTotal", { points: totalPoints })}</p>
              {nextTierLabel && typeof pointsToNextTier === "number" && (
                <p>
                  {t("checkout.confirmation.loyaltyProgress", {
                    nextTier: nextTierLabel,
                    points: pointsToNextTier,
                  })}
                </p>
              )}
            </div>
            {referralProfile && referralLink && (
              <section className="checkout-confirmation__referral" aria-live="polite">
                <p>{t("checkout.confirmation.referralHint")}</p>
                <div className="checkout-confirmation__referral-actions">
                  <input value={referralLink} readOnly />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReferralCopy}
                  >
                    {t(
                      referralCopyState === "copied"
                        ? "account.referrals.copied"
                        : "account.referrals.copyLink"
                    )}
                  </Button>
                </div>
                {referralCopyState === "error" && (
                  <p className="checkout-confirmation__referral-error">
                    {t("account.referrals.copyError")}
                  </p>
                )}
              </section>
            )}
            <div className="checkout-confirmation__actions">
              <Button
                variant="ghost"
                size="md"
                onClick={() => navigateToAppPath("/orders-history")}
              >
                {t("checkout.confirmation.viewOrders")}
              </Button>
              <Button variant="primary" size="md" onClick={() => navigateToAppPath("/")}>
                {t("cta.goToShop")}
              </Button>
            </div>
          </section>
        ) : (
          <>
            <div
              className="checkout-stepper"
              data-animate="fade-up"
              role="list"
              aria-label={t("checkout.stepperLabel")}
            >
              {STEPS.map((step, index) => {
                const isCurrent = index === currentStep;
                return (
                  <div
                    key={step}
                    role="listitem"
                    aria-current={isCurrent ? "step" : undefined}
                    className={`checkout-stepper__segment ${
                      isCurrent ? "is-current" : index < currentStep ? "is-done" : ""
                    }`}
                  >
                    <span>{index + 1}</span>
                    <p>{t(step)}</p>
                  </div>
                );
              })}
            </div>

            {currentStep === 0 && (
              <section className="checkout-card">
                <h3>{t("checkout.sections.contact")}</h3>
                <p>{t("checkout.sections.contactHelp")}</p>
                <div className="checkout-form-grid">
                  {renderContactField("fullName", "checkout.fields.fullName", true)}
                  {renderContactField("email", "checkout.fields.email", true)}
                  {renderContactField("phone", "checkout.fields.phone")}
                  {renderContactField("country", "checkout.fields.country")}
                {renderContactField("city", "checkout.fields.city", true)}
                {renderContactField("street", "checkout.fields.street", true)}
                {renderContactField("postalCode", "checkout.fields.postalCode")}
              </div>
              <div className="checkout-field checkout-field--full">
                <label className="checkout-consent">
                  <input
                    type="checkbox"
                    checked={keepUpdated}
                    onChange={(event) => setKeepUpdated(event.target.checked)}
                  />
                  <span>{t("checkout.newsletterConsent")}</span>
                </label>
              </div>
            </section>
          )}

            {currentStep === 1 && (
              <section className="checkout-card">
                <h3>{t("checkout.sections.shipping")}</h3>
                <p>{t("checkout.sections.shippingHelp")}</p>
                <div className="checkout-shipping-grid">
                  <div className="checkout-address-summary">
                    <h4>{t("checkout.shipping.addressTitle")}</h4>
                    <p>{contactInfo.fullName}</p>
                    <p>{contactInfo.street}</p>
                    <p>
                      {contactInfo.city} · {contactInfo.country || t("checkout.defaults.country")}
                    </p>
                  </div>
                  <div
                    className="checkout-shipping-options"
                    role="radiogroup"
                    aria-label={t("checkout.sections.shipping")}
                  >
                    {SHIPPING_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`checkout-shipping-option ${
                          selectedShippingId === option.id ? "is-selected" : ""
                        }`}
                        role="radio"
                        aria-checked={selectedShippingId === option.id}
                        tabIndex={selectedShippingId === option.id ? 0 : -1}
                        onKeyDown={(event) => handleShippingKeyDown(event, option.id)}
                        onClick={() => setSelectedShippingId(option.id)}
                      >
                        <div>
                          <p className="checkout-shipping-option__label">
                            {t(`checkout.shippingOptions.${option.id}.label` as AppTranslationKey)}
                          </p>
                          <p className="checkout-shipping-option__desc">
                            {t(
                              `checkout.shippingOptions.${option.id}.description` as AppTranslationKey
                            )}
                          </p>
                        </div>
                        <div className="checkout-shipping-option__meta">
                          <span>{formatCurrency(option.cost, currency)}</span>
                          <small>
                            {t(`checkout.shippingOptions.${option.id}.eta` as AppTranslationKey)}
                          </small>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {currentStep === 2 && (
              <section className="checkout-card">
                <h3>{t("checkout.sections.payment")}</h3>
                <p>{t("checkout.sections.paymentHelp")}</p>
                <div className="checkout-payment-methods">
                  {PAYMENT_METHODS.map((method) => (
                    <label
                      key={method.id}
                      className={`checkout-payment-option ${
                        paymentMethod === method.id ? "is-active" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => {
                          setPaymentMethod(method.id as "card" | "cod");
                          setErrors({});
                        }}
                      />
                      <span>{t(method.labelKey)}</span>
                    </label>
                  ))}
                </div>
                {paymentMethod === "card" && (
                  <div className="checkout-form-grid">
                    <div className="checkout-field">
                      <label htmlFor="cardNumber">{t("checkout.fields.cardNumber")}</label>
                      <input
                        id="cardNumber"
                        value={cardData.number}
                        onChange={(e) => handleCardInput("number", e.target.value)}
                        className="checkout-input"
                        placeholder="0000 0000 0000 0000"
                        aria-invalid={errors.number ? "true" : undefined}
                        aria-describedby={errors.number ? "cardNumber-error" : undefined}
                      />
                      {errors.number && (
                        <p id="cardNumber-error" className="checkout-error">
                          {errors.number}
                        </p>
                      )}
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="cardExpiry">{t("checkout.fields.cardExpiry")}</label>
                      <input
                        id="cardExpiry"
                        value={cardData.expiry}
                        onChange={(e) => handleCardInput("expiry", e.target.value)}
                        className="checkout-input"
                        placeholder="MM/YY"
                        aria-invalid={errors.expiry ? "true" : undefined}
                        aria-describedby={errors.expiry ? "cardExpiry-error" : undefined}
                      />
                      {errors.expiry && (
                        <p id="cardExpiry-error" className="checkout-error">
                          {errors.expiry}
                        </p>
                      )}
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="cardCvc">{t("checkout.fields.cardCvc")}</label>
                      <input
                        id="cardCvc"
                        value={cardData.cvc}
                        onChange={(e) => handleCardInput("cvc", e.target.value)}
                        className="checkout-input"
                        placeholder="CVC"
                        aria-invalid={errors.cvc ? "true" : undefined}
                        aria-describedby={errors.cvc ? "cardCvc-error" : undefined}
                      />
                      {errors.cvc && (
                        <p id="cardCvc-error" className="checkout-error">
                          {errors.cvc}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {currentStep === 3 && (
              <section className="checkout-card">
                <h3>{t("checkout.sections.review")}</h3>
                <p>{t("checkout.sections.reviewHelp")}</p>
                <div className="checkout-card__promo">
                  <PromoCodePanel shippingCost={shippingCost} />
                </div>
                <div className="checkout-review">
                  <div className="checkout-review__items">
                    {cartItems.map((item) => (
                      <div key={item.id} className="checkout-review__item">
                        <div>
                          <strong>{renderItemLabel(item)}</strong>
                          {formatVariantMeta(item.variantLabel, item.variantAttributes) && (
                            <p className="checkout-review__meta">
                              {formatVariantMeta(item.variantLabel, item.variantAttributes)}
                            </p>
                          )}
                          {item.bundleItems && item.bundleItems.length > 0 && (
                            <ul className="checkout-review__sub-items">
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
                                      <small className="checkout-review__sub-meta">
                                        {bundleVariant}
                                      </small>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                          {item.giftBox?.items && item.giftBox.items.length > 0 && (
                            <ul className="checkout-review__sub-items">
                              {item.giftBox.items.map((giftItem) => {
                                const giftVariant = formatVariantMeta(
                                  giftItem.variantLabel,
                                  giftItem.variantAttributes
                                );
                                return (
                                  <li key={`${item.id}-${giftItem.productId}`}>
                                    <span>{giftItem.name}</span>
                                    {giftVariant && (
                                      <small className="checkout-review__sub-meta">
                                        {giftVariant}
                                      </small>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="checkout-review__price">{formatCurrency(item.price, currency)}</p>
                          <small>
                            × {item.quantity}
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="checkout-review__totals">
                    <div>
                      <span>{t("checkout.review.labels.subtotal")}</span>
                      <strong>{formatCurrency(subtotal, currency)}</strong>
                    </div>
                    {discountTotal > 0 && (
                      <div>
                        <span>{t("checkout.review.labels.discount")}</span>
                        <strong>-{formatCurrency(discountTotal, currency)}</strong>
                      </div>
                    )}
                    <div>
                      <span>{t("checkout.review.labels.shipping")}</span>
                      <strong>
                        {appliedPromo?.freeShipping
                          ? t("cart.promo.freeShipping")
                          : formatCurrency(finalShippingCost, currency)}
                      </strong>
                    </div>
                    {creditAppliedBase > 0 && (
                      <div>
                        <span>{t("checkout.review.labels.giftCredit")}</span>
                        <strong>-{formatCurrency(creditAppliedBase, currency)}</strong>
                      </div>
                    )}
                    <div>
                      <span>{t("checkout.review.labels.total")}</span>
                      <strong>{formatCurrency(totalAfterCredit, currency)}</strong>
                    </div>
                    {appliedPromo?.code && (
                      <div className="checkout-review__promo-code">
                        <span>{t("checkout.review.labels.promoCode")}</span>
                        <p>{appliedPromo.code}</p>
                      </div>
                    )}
                    <div className="checkout-review__method">
                      <span>{t("checkout.review.labels.shippingMethod")}</span>
                      <p>{t(`checkout.shippingOptions.${shippingMethod.id}.label` as AppTranslationKey)}</p>
                    </div>
                    <div className="checkout-review__method">
                      <span>{t("checkout.review.labels.payment")}</span>
                      <p>{t(`checkout.payment.methods.${paymentMethod}` as AppTranslationKey)}</p>
                    </div>
                    <div className="checkout-review__address">
                      <span>{t("checkout.review.labels.address")}</span>
                      <p>{contactInfo.street}</p>
                      <p>
                        {contactInfo.city} · {contactInfo.country || t("checkout.defaults.country")}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            <div className="checkout-controls">
              {currentStep > 0 && (
                <Button variant="ghost" size="md" onClick={handleBack}>
                  {t("checkout.actions.back")}
                </Button>
              )}
              {currentStep < STEPS.length - 1 && (
                <Button variant="primary" size="md" onClick={handleNext}>
                  {t("checkout.actions.next")}
                </Button>
              )}
              {currentStep === STEPS.length - 1 && (
                <Button variant="primary" size="md" onClick={placeOrder} disabled={!isOnline}>
                  {t("checkout.actions.placeOrder")}
                </Button>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
