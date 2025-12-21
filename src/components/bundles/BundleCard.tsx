import { memo, useEffect, useMemo, useState } from "react";
import { Button, Card } from "@/components/ui";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { CompareToggle } from "@/components/CompareToggle";
import { RitualBundle } from "@/content/bundles";
import {
  getDefaultVariant,
  getProductVariants,
  getLocalizedProductName,
  getLocalizedProductVariants,
} from "@/content/productDetails";
import { getBundlePricing } from "@/content/bundlePricing";
import { formatCurrency } from "@/utils/formatCurrency";
import { useTranslation } from "@/localization/locale";
import { trackEvent, type BundleViewSource } from "@/analytics/events";
import { useCurrency } from "@/currency/CurrencyProvider";

export interface BundleCardProps {
  bundle: RitualBundle;
  onAddBundle?: (bundle: RitualBundle, variantSelection?: Record<string, string>) => void;
  onViewDetails?: (bundle: RitualBundle) => void;
  heroImage?: string;
  viewSource?: BundleViewSource;
}

function BundleCardBase({
  bundle,
  onAddBundle,
  onViewDetails,
  heroImage,
  viewSource,
}: BundleCardProps) {
  const { t, locale } = useTranslation();
  const { currency } = useCurrency();
  const pricing = getBundlePricing(bundle);
  const bundlePriceDisplay = formatCurrency(pricing.bundlePrice, currency);
  const compareAtDisplay = formatCurrency(pricing.compareAt, currency);
  const savingsDisplay = formatCurrency(pricing.savingsAmount, currency);
  const initialVariantSelection = () => {
    const fallback: Record<string, string> = {};
    bundle.products.forEach((entry) => {
      const variantId = entry.variantId ?? getDefaultVariant(entry.productId)?.variantId;
      if (variantId) {
        fallback[entry.productId] = variantId;
      }
    });
    return fallback;
  };

  const [variantSelection, setVariantSelection] = useState<Record<string, string>>(
    initialVariantSelection
  );

  useEffect(() => {
    setVariantSelection(initialVariantSelection());
  }, [bundle.id]);

  const hasVariantProducts = useMemo(
    () => bundle.products.filter((entry) => getProductVariants(entry.productId).length > 0),
    [bundle.products]
  );

  const bundleName = locale === "ar" ? bundle.nameAr ?? bundle.name : bundle.name;
  const bundleTagline = locale === "ar" ? bundle.taglineAr ?? bundle.tagline : bundle.tagline;
  const bundleDescription =
    locale === "ar" ? bundle.descriptionAr ?? bundle.description : bundle.description;
  const bundleHighlight =
    locale === "ar" ? bundle.highlightAr ?? bundle.highlight : bundle.highlight;

  useEffect(() => {
    trackEvent({
      type: "view_bundle",
      bundleId: bundle.id,
      source: viewSource ?? "shop",
    });
  }, [bundle.id, viewSource]);
  return (
    <Card className="bundle-card hover-lift" data-animate="fade-up">
      <CompareToggle id={bundle.id} type="bundle" itemLabel={bundleName} />
      <FavoriteToggle id={bundle.id} type="bundle" itemLabel={bundleName} />
      {heroImage && (
        <div className="bundle-card__hero">
          <img
            src={heroImage}
            alt={bundleName}
            width="480"
            height="360"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}
      <header className="bundle-card__header">
        <p className="bundle-card__tagline">{bundleTagline}</p>
        <h3>{bundleName}</h3>
        {bundleHighlight && <p className="bundle-card__highlight">{bundleHighlight}</p>}
      </header>

      <p className="bundle-card__description">{bundleDescription}</p>
      <ul className="bundle-card__products">
        {bundle.products.map((entry) => {
          const name = getLocalizedProductName(entry.productId, locale);
          return <li key={entry.productId}>{name}</li>;
        })}
      </ul>
      {hasVariantProducts.length > 0 && (
        <div className="bundle-card__variant-grid">
          {hasVariantProducts.map((entry) => {
            const variantOptions = getLocalizedProductVariants(entry.productId, locale);
            if (!variantOptions.length) {
              return null;
            }
            const selectedValue =
              variantSelection[entry.productId] ?? variantOptions[0]?.variantId ?? "";
            const label = getLocalizedProductName(entry.productId, locale);
            return (
              <label key={entry.productId} className="bundle-card__variant-control">
                <span>{label}</span>
                <select
                  value={selectedValue}
                  onChange={(event) =>
                    setVariantSelection((prev) => ({
                      ...prev,
                      [entry.productId]: event.target.value,
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
            );
          })}
        </div>
      )}
      <div className="bundle-card__pricing">
        <span className="bundle-card__price">{bundlePriceDisplay}</span>
        {pricing.compareAt > pricing.bundlePrice && (
          <span className="bundle-card__compare">
            {t("bundleCard.compareAtLabel")} {compareAtDisplay}
          </span>
        )}
        {pricing.savingsAmount > 0 && (
          <span className="bundle-card__savings">
            {t("bundleCard.savingsLabel")} {savingsDisplay}
            {pricing.savingsPercent > 0 && ` (${pricing.savingsPercent}%)`}
          </span>
        )}
      </div>

      <div className="bundle-card__actions">
        {onAddBundle && (
          <Button
            variant="primary"
            size="md"
            onClick={() => onAddBundle(bundle, variantSelection)}
          >
            {t("cta.addRitualToBag")}
          </Button>
        )}
        {onViewDetails && (
          <button
            type="button"
            className="bundle-card__details"
            onClick={() => onViewDetails(bundle)}
          >
            {t("cta.viewRitual")}
          </button>
        )}
      </div>
    </Card>
  );
}

export const BundleCard = memo(BundleCardBase);
