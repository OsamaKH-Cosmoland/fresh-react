import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import {
  giftAddOns,
  giftBoxStyles,
  GIFT_BOX_MAX_PRODUCTS,
  GIFT_BOX_MIN_PRODUCTS,
} from "@/content/giftBoxes";
import {
  PRODUCT_DETAIL_CONFIGS,
  getDefaultVariant,
  getProductVariants,
  getVariantById,
  type ProductDetailContent,
} from "@/content/productDetails";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  calculateAddOnTotal,
  calculateGiftTotal,
  calculateProductTotal,
} from "@/utils/giftPricing";
import { useTranslation } from "@/localization/locale";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { useCurrency } from "@/currency/CurrencyProvider";

const steps = [
  "Choose your box",
  "Select 2–4 products",
  "Add a note & extras",
  "Review & confirm",
];

export default function GiftBuilderPage() {
  usePageAnalytics("gift_builder");
  useSeo({ route: "gift_builder" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedStyleId, setSelectedStyleId] = useState<string>(giftBoxStyles[0]?.id ?? "");
  const [selectedProducts, setSelectedProducts] = useState<ProductDetailContent[]>([]);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState<string | null>(null);
  const { addItem } = useCart();
  const { t } = useTranslation();
  const { currency } = useCurrency();

  const currentStyle = giftBoxStyles.find((style) => style.id === selectedStyleId);

  const toggleProduct = (product: ProductDetailContent) => {
    setSuccess(null);
    const exists = selectedProducts.some((entry) => entry.productId === product.productId);
    if (exists) {
      setSelectedProducts((prev) => prev.filter((entry) => entry.productId !== product.productId));
      setSelectedVariants((prev) => {
        const next = { ...prev };
        delete next[product.productId];
        return next;
      });
      return;
    }
    if (selectedProducts.length >= GIFT_BOX_MAX_PRODUCTS) return;
    setSelectedProducts((prev) => [...prev, product]);
    setSelectedVariants((prev) => {
      if (prev[product.productId]) return prev;
      const defaultVariantId = getDefaultVariant(product.productId)?.variantId;
      if (!defaultVariantId) return prev;
      return { ...prev, [product.productId]: defaultVariantId };
    });
  };

  const toggleAddOn = (addOnId: string) => {
    setSuccess(null);
    setSelectedAddOns((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  const productTotal = useMemo(
    () => calculateProductTotal(selectedProducts, selectedVariants),
    [selectedProducts, selectedVariants]
  );

  const addOnTotal = useMemo(
    () => calculateAddOnTotal(selectedAddOns),
    [selectedAddOns]
  );

  const totalPrice = calculateGiftTotal(currentStyle?.price ?? 0, productTotal, addOnTotal);

  const canNextStep = () => {
    if (currentStep === 1) return Boolean(currentStyle);
    if (currentStep === 2) return selectedProducts.length >= GIFT_BOX_MIN_PRODUCTS;
    return true;
  };

  const handleNext = () => {
    if (!canNextStep()) return;
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleAddGift = () => {
    if (!currentStyle || selectedProducts.length < GIFT_BOX_MIN_PRODUCTS) return;
    const giftId = `gift-${Date.now()}`;
    addItem({
      id: giftId,
      name: `Gift Box — ${currentStyle.name}`,
      price: totalPrice,
      quantity: 1,
      imageUrl: currentStyle.image,
      giftBoxId: currentStyle.id,
      giftBox: {
        styleName: currentStyle.name,
        note: note.trim() || undefined,
        addons: selectedAddOns.map(
          (addOnId) => giftAddOns.find((entry) => entry.id === addOnId)?.label ?? ""
        ),
        items: selectedProducts.map((product) => {
          const variantId = selectedVariants[product.productId];
          const variant =
            (variantId && getVariantById(product.productId, variantId)) ??
            getDefaultVariant(product.productId);
          const price = variant?.priceNumber ?? product.priceNumber;
          return {
            productId: product.productId,
            name: product.productName,
            price,
            quantity: 1,
            variantId: variant?.variantId,
            variantLabel: variant?.label,
            variantAttributes: variant?.attributes,
          };
        }),
        boxPrice: currentStyle.price,
        addonsPrice: addOnTotal,
      },
    });
    trackEvent({
      type: "gift_builder_completed",
      boxId: currentStyle.id,
      productCount: selectedProducts.length,
      addonsCount: selectedAddOns.length,
      totalPrice,
    });
    setSuccess("Gift box added to your bag.");
    setCurrentStep(1);
    setSelectedProducts([]);
    setSelectedAddOns([]);
    setNote("");
  };

  const stepContent = () => {
    if (currentStep === 1) {
      return (
        <div
          className="gift-builder__styles ng-grid-mobile-2"
          role="radiogroup"
          aria-label={t("giftBuilder.boxSelectorLabel")}
        >
          {giftBoxStyles.map((style) => {
            const isSelected = selectedStyleId === style.id;
            return (
              <Card
                key={style.id}
                className={`gift-builder-card${isSelected ? " is-selected" : ""}`}
                role="radio"
                aria-checked={isSelected}
                tabIndex={0}
                onClick={() => setSelectedStyleId(style.id)}
                onKeyDown={(event) => {
                  if (event.key === " " || event.key === "Enter") {
                    event.preventDefault();
                    setSelectedStyleId(style.id);
                  }
                }}
              >
                <div
                  className="gift-builder-card__swatch"
                  style={{ backgroundColor: style.color }}
                  aria-hidden="true"
                />
                <h3>{style.name}</h3>
                <p>{style.description}</p>
                <p className="gift-builder-card__price">{formatCurrency(style.price, currency)}</p>
              </Card>
            );
          })}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <>
          <p className="gift-builder__hint">
            Choose {GIFT_BOX_MIN_PRODUCTS}–{GIFT_BOX_MAX_PRODUCTS} products to go inside your box.
          </p>
          <div className="gift-builder__products ng-grid-mobile-2">
            {PRODUCT_DETAIL_CONFIGS.map((product) => {
              const selected = selectedProducts.some(
                (entry) => entry.productId === product.productId
              );
              const disabled = !selected && selectedProducts.length >= GIFT_BOX_MAX_PRODUCTS;
              const variantOptions = getProductVariants(product.productId);
              const defaultVariant =
                selectedVariants[product.productId] ?? variantOptions[0]?.variantId ?? "";
              return (
                <Card
                  key={product.productId}
                  className={`gift-builder-product ${selected ? "is-selected" : ""}`}
                  data-animate="fade-up"
                >
                  <div className="gift-builder-product__header">
                    <h3>{product.productName}</h3>
                    <span>{formatCurrency(product.priceNumber, currency)}</span>
                  </div>
                  <p className="gift-builder-product__tagline">{product.shortTagline}</p>
                  {variantOptions.length > 0 && (
                    <label className="gift-builder-product__variant">
                      <span>Choose a variant</span>
                      <select
                        value={defaultVariant}
                        onChange={(event) =>
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [product.productId]: event.target.value,
                          }))
                        }
                      >
                        {variantOptions.map((variant) => (
                          <option key={variant.variantId} value={variant.variantId}>
                            {variant.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  <Button
                    variant={selected ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => toggleProduct(product)}
                    disabled={disabled && !selected}
                    aria-pressed={selected}
                    aria-label={
                      selected
                        ? t("giftBuilder.actions.removeProduct", { name: product.productName })
                        : t("giftBuilder.actions.addProduct", { name: product.productName })
                    }
                  >
                    {selected ? "Selected" : "Add"}
                  </Button>
                </Card>
              );
            })}
          </div>
        </>
      );
    }

    if (currentStep === 3) {
      return (
        <>
          <div className="gift-builder-addons ng-grid-mobile-2">
            {giftAddOns.map((addOn) => {
              const selected = selectedAddOns.includes(addOn.id);
              return (
                <Card key={addOn.id} className={`gift-builder-addon ${selected ? "is-selected" : ""}`}>
                  <div className="gift-builder-addon__details">
                    <h3>{addOn.label}</h3>
                    <p>{addOn.description}</p>
                  </div>
                  <div className="gift-builder-addon__actions">
                    <span>{formatCurrency(addOn.price, currency)}</span>
                    <Button
                      variant={selected ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => toggleAddOn(addOn.id)}
                      aria-pressed={selected}
                      aria-label={
                        selected
                          ? t("giftBuilder.actions.removeAddOn", { name: addOn.label })
                          : t("giftBuilder.actions.addAddOn", { name: addOn.label })
                      }
                    >
                      {selected ? "Remove" : "Add"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
          <label className="gift-builder-note">
            Optional note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write a personal message (e.g. ‘For warm evenings of calm’)"
            />
          </label>
        </>
      );
    }

    return (
      <div className="gift-builder-review">
        <h3>Box</h3>
        <p>{currentStyle?.name}</p>
        <p className="gift-builder-review__line">
          Box: {formatCurrency(currentStyle?.price ?? 0, currency)}
        </p>
        <h3>Products</h3>
        <ul className="gift-builder-review__list">
            {selectedProducts.map((product) => (
            <li key={product.productId}>
              {product.productName} — {formatCurrency(product.priceNumber, currency)}
            </li>
          ))}
        </ul>
        {selectedAddOns.length > 0 && (
          <>
            <h3>Add-ons</h3>
            <ul className="gift-builder-review__list">
              {selectedAddOns.map((addOnId) => {
                const addOn = giftAddOns.find((entry) => entry.id === addOnId);
                if (!addOn) return null;
                return (
                  <li key={addOnId}>
                    {addOn.label} — {formatCurrency(addOn.price, currency)}
                  </li>
                );
              })}
            </ul>
          </>
        )}
        {note && (
          <>
            <h3>Note</h3>
            <p className="gift-builder-note__preview">{note}</p>
          </>
        )}
        <p className="gift-builder-review__total">
          Total: <strong>{formatCurrency(totalPrice, currency)}</strong>
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={handleAddGift}
          disabled={selectedProducts.length < GIFT_BOX_MIN_PRODUCTS || !currentStyle}
        >
          Add gift to bag
        </Button>
        {success && <p className="gift-builder-success">{success}</p>}
      </div>
    );
  };

  return (
    <div className="gift-builder-page">
      <Navbar sticky onMenuToggle={() => setSidebarOpen(true)} showSectionLinks={false} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="gift-builder-page__content ng-mobile-shell">
        <SectionTitle
          title="Build your gift"
          subtitle="Curate a custom box and let us wrap it with calm intention."
          align="left"
        />
        <div className="gift-builder-steps">
          <p className="gift-builder-steps__count">
            Step {currentStep} of {steps.length}
          </p>
          <div
            className="gift-builder-steps__list"
            role="list"
            aria-label={t("giftBuilder.stepperLabel")}
          >
            {steps.map((label, index) => {
              const isActive = currentStep === index + 1;
              return (
                <span
                  key={label}
                  className={`gift-builder-step${isActive ? " is-active" : ""}`}
                  role="listitem"
                  aria-current={isActive ? "step" : undefined}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>

        <section className="gift-builder-stage">{stepContent()}</section>

        <div className="gift-builder-controls">
          {currentStep > 1 && (
            <Button variant="ghost" size="md" onClick={handleBack}>
              Back
            </Button>
          )}
          {currentStep < steps.length && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleNext}
              disabled={!canNextStep()}
            >
              Next
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
