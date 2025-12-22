import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { getCompareProductConfig, getCompareBundleConfig } from "@/content/compareCatalog";
import { ritualBundles, type RitualBundle } from "@/content/bundles";
import { useTranslation } from "@/localization/locale";
import { useCompare } from "@/compare/compareStore";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { PRODUCT_DETAIL_MAP, localizeProductDetail } from "@/content/productDetails";
import { useSeo } from "@/seo/useSeo";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCurrency } from "@/currency/CurrencyProvider";

const navigateTo = (path: string) => {
  if (typeof window === "undefined") return;
  window.location.href = path;
};

type CompareColumn = {
  id: string;
  type: "product" | "bundle";
  label: string;
  heroImage?: string;
  slug?: string;
  focus: string[];
  benefits: string[] | string;
  texture: string[];
  usage: string[];
  included: string[];
  priceNumber: number;
  detail?: { productId: string; productName: string; priceNumber: number; heroImage?: string };
  bundle?: RitualBundle;
};

export default function ComparePage() {
  usePageAnalytics("compare");
  useSeo({ route: "compare" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { listCompared, toggleCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const recordProductAdd = (id: string, price: number, variantId?: string) => {
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id,
      quantity: 1,
      price,
      variantId,
      source: "compare",
    });
  };
  const entries = listCompared();
  const { t, locale } = useTranslation();
  const { currency } = useCurrency();

  const columns = useMemo<CompareColumn[]>(
    () =>
      entries
        .map((entry) => {
          if (entry.type === "product") {
            const config = getCompareProductConfig(entry.id, locale);
            if (!config) return null;
            return {
              id: entry.id,
              type: "product",
              label: config.label,
              heroImage: config.detail.heroImage,
              slug: config.slug,
              focus: config.focus,
              benefits: config.benefits,
              texture: config.texture,
              usage: config.usage,
              included: [config.format],
              priceNumber: config.detail.priceNumber,
              detail: {
                productId: config.detail.productId,
                productName: config.detail.productName,
                priceNumber: config.detail.priceNumber,
                heroImage: config.detail.heroImage,
              },
            };
          }
          const config = getCompareBundleConfig(entry.id, locale);
          if (!config) return null;
          const bundleId = entry.id;
          const actualBundle = ritualBundles.find((bundle) => bundle.id === bundleId);
          return {
            id: entry.id,
            type: "bundle",
            label: config.label,
            heroImage: getBundleHeroImage(bundleId),
            focus: config.focus,
            benefits: [config.benefits],
            texture: config.texture,
            usage: config.ritualType,
            included: config.included,
            priceNumber: actualBundle?.bundlePriceNumber ?? 0,
            bundle: actualBundle,
          };
        })
        .filter((value): value is CompareColumn => Boolean(value)),
    [entries, locale]
  );

  const hasColumns = columns.length > 0;

  return (
    <div className="shop-page search-page">
      <Navbar
        sticky
        showSectionLinks={false}
        compactSearch
        onMenuToggle={() => setSidebarOpen(true)}
        menuOpen={sidebarOpen}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" tabIndex={-1} className="shop-page__content ng-mobile-shell">
        <SectionTitle
          title={t("compare.title")}
          subtitle={t("compare.subtitle")}
          align="center"
        />

        <div className="compare-controls">
          <Button variant="ghost" size="md" onClick={() => clearCompare()} disabled={!hasColumns}>
            {t("cta.clearAll")}
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigateTo("/shop")}
          >
            {t("cta.backToShop")}
          </Button>
        </div>

        {hasColumns ? (
          <section className="compare-grid ng-grid-mobile-2">
            {columns.map((column) => (
              <Card key={`${column.type}-${column.id}`} className="compare-column">
                {column.heroImage && (
                  <div className="compare-column__hero">
                    <img src={column.heroImage} alt={column.label} />
                  </div>
                )}
                <div className="compare-column__header">
                  <h3>{column.label}</h3>
                  <button
                    type="button"
                    className="compare-column__remove"
                    onClick={() => toggleCompare({ id: column.id, type: column.type })}
                  >
                    {t("compare.actions.remove")}
                  </button>
                </div>
                <div className="compare-column__body">
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.focus")}</p>
                    <div className="compare-column__chips">
                      {column.focus.map((value) => (
                        <span key={`${column.id}-focus-${value}`}>{value}</span>
                      ))}
                    </div>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.benefits")}</p>
                    <p className="compare-column__row-value">
                      {Array.isArray(column.benefits) ? column.benefits.join(" • ") : column.benefits}
                    </p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.texture")}</p>
                    <p className="compare-column__row-value">{column.texture.join(" • ")}</p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.usage")}</p>
                    <p className="compare-column__row-value">
                      {column.usage.length > 0 ? column.usage.join(" • ") : t("compare.labels.anyRoutine")}
                    </p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.included")}</p>
                    <p className="compare-column__row-value">{column.included.join(", ")}</p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">{t("compare.labels.price")}</p>
                    <p className="compare-column__row-value">
                      {formatCurrency(column.priceNumber ?? 0, currency)}
                    </p>
                  </div>
                </div>
                <div className="compare-column__actions">
                  {column.type === "product" && column.detail && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const detailEntry = PRODUCT_DETAIL_MAP[column.detail.productId];
                        if (detailEntry) {
                          const payload = buildProductCartPayload(
                            localizeProductDetail(detailEntry, locale)
                          );
                          addItem(payload);
                          recordProductAdd(detailEntry.productId, payload.price, payload.variantId);
                          return;
                        }
                        const fallbackPayload = {
                          productId: column.detail.productId,
                          id: column.detail.productId,
                          name: column.detail.productName,
                          price: column.detail.priceNumber,
                          imageUrl: column.detail.heroImage,
                        };
                        addItem(fallbackPayload);
                        recordProductAdd(column.detail.productId, fallbackPayload.price);
                      }}
                    >
                      {t("cta.addToBag")}
                    </Button>
                  )}
                  {column.type === "bundle" && column.bundle && (
                    <>
                      <Button
                        variant="primary"
                        size="md"
                        onClick={() => addBundleToCart(column.bundle)}
                      >
                        {t("cta.addRitualToBag")}
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() =>
                      navigateTo(
                        column.type === "product" ? `/products/${column.slug}` : "/shop"
                      )
                    }
                  >
                    {t("cta.viewDetails")}
                  </Button>
                </div>
              </Card>
            ))}
          </section>
        ) : (
          <div className="shop-empty-state">
            <h3>{t("compare.empty.title")}</h3>
            <p>{t("compare.empty.body")}</p>
            <div className="shop-product-card__actions">
              <Button variant="secondary" size="md" onClick={() => navigateTo("/shop")}>
                {t("cta.browseShop")}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
