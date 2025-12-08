import { useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Button, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { formatCurrency } from "@/utils/formatCurrency";
import { addOrder } from "@/utils/orderStorage";
import type { LocalOrder, ShippingMethod } from "@/types/localOrder";
import { useTranslation, type AppTranslationKey } from "@/localization/locale";
import { formatVariantMeta } from "@/utils/variantDisplay";

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
  const { t } = useTranslation();
  const { cartItems, subtotal, clearCart } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [contactInfo, setContactInfo] = useState(EMPTY_CONTACT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedShippingId, setSelectedShippingId] = useState(SHIPPING_OPTIONS[0].id);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvc: "" });
  const [orderPlaced, setOrderPlaced] = useState<LocalOrder | null>(null);

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
  const total = subtotal + shippingCost;

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

  const placeOrder = () => {
    if (!hasCartItems || !shippingMethod) return;
    const orderId = generateOrderId();
    const order: LocalOrder = {
      id: orderId,
      createdAt: new Date().toISOString(),
      items: cartItems.map((item) => ({ ...item })),
      totals: {
        subtotal: Number(subtotal.toFixed(2)),
        shippingCost,
        total: Number(total.toFixed(2)),
        currency: "EGP",
      },
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
    };
    addOrder(order);
    clearCart();
    setOrderPlaced(order);
    setCurrentStep(STEPS.length - 1);
  };

  const navigateToAppPath = (path: string) => {
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = path;
    destination.search = "";
    destination.hash = "";
    window.location.href = destination.toString();
  };

const renderContactField = (name: keyof typeof contactInfo, labelKey: AppTranslationKey, required = false) => (
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
    />
    {errors[name] && <p className="checkout-error">{errors[name]}</p>}
  </div>
);

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
      <Navbar sticky onMenuToggle={() => setDrawerOpen(true)} />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="checkout-shell ng-mobile-shell">
        <header className="checkout-hero" data-animate="fade-up">
          <SectionTitle
            title={t("checkout.hero.title")}
            subtitle={t("checkout.hero.subtitle")}
            align="center"
          />
          <p className="checkout-hero__meta">{t("checkout.hero.meta")}</p>
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
                  total: formatCurrency(orderPlaced.totals.total),
                })}
              </p>
            </div>
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
            <div className="checkout-stepper" data-animate="fade-up">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className={`checkout-stepper__segment ${
                    index === currentStep ? "is-current" : index < currentStep ? "is-done" : ""
                  }`}
                >
                  <span>{index + 1}</span>
                  <p>{t(step)}</p>
                </div>
              ))}
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
                  <div className="checkout-shipping-options">
                    {SHIPPING_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        className={`checkout-shipping-option ${
                          selectedShippingId === option.id ? "is-selected" : ""
                        }`}
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
                          <span>{formatCurrency(option.cost)}</span>
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
                      />
                      {errors.number && <p className="checkout-error">{errors.number}</p>}
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="cardExpiry">{t("checkout.fields.cardExpiry")}</label>
                      <input
                        id="cardExpiry"
                        value={cardData.expiry}
                        onChange={(e) => handleCardInput("expiry", e.target.value)}
                        className="checkout-input"
                        placeholder="MM/YY"
                      />
                      {errors.expiry && <p className="checkout-error">{errors.expiry}</p>}
                    </div>
                    <div className="checkout-field">
                      <label htmlFor="cardCvc">{t("checkout.fields.cardCvc")}</label>
                      <input
                        id="cardCvc"
                        value={cardData.cvc}
                        onChange={(e) => handleCardInput("cvc", e.target.value)}
                        className="checkout-input"
                        placeholder="CVC"
                      />
                      {errors.cvc && <p className="checkout-error">{errors.cvc}</p>}
                    </div>
                  </div>
                )}
              </section>
            )}

            {currentStep === 3 && (
              <section className="checkout-card">
                <h3>{t("checkout.sections.review")}</h3>
                <p>{t("checkout.sections.reviewHelp")}</p>
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
                          <p className="checkout-review__price">{formatCurrency(item.price)}</p>
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
                      <strong>{formatCurrency(subtotal)}</strong>
                    </div>
                    <div>
                      <span>{t("checkout.review.labels.shipping")}</span>
                      <strong>{formatCurrency(shippingCost)}</strong>
                    </div>
                    <div>
                      <span>{t("checkout.review.labels.total")}</span>
                      <strong>{formatCurrency(total)}</strong>
                    </div>
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
                <Button variant="primary" size="md" onClick={placeOrder}>
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
