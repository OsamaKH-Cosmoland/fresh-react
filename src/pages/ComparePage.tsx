import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { getCompareProductConfig, getCompareBundleConfig } from "@/content/compareCatalog";
import { ritualBundles, type RitualBundle } from "@/content/bundles";
import { useTranslation } from "@/localization/locale";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";

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
  priceLabel: string;
  detail?: { productId: string; productName: string; priceNumber: number; heroImage?: string };
  bundle?: RitualBundle;
};

export default function ComparePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { listCompared, toggleCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const entries = listCompared();
  const { t } = useTranslation();

  const columns = useMemo<CompareColumn[]>(
    () =>
      entries
        .map((entry) => {
          if (entry.type === "product") {
            const config = getCompareProductConfig(entry.id);
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
              priceLabel: config.priceLabel,
              detail: {
                productId: config.detail.productId,
                productName: config.detail.productName,
                priceNumber: config.detail.priceNumber,
                heroImage: config.detail.heroImage,
              },
            };
          }
          const config = getCompareBundleConfig(entry.id);
          if (!config) return null;
          const bundleId = entry.id;
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
            priceLabel: config.priceLabel,
            bundle: ritualBundles.find((bundle) => bundle.id === bundleId),
          };
        })
        .filter((value): value is CompareColumn => Boolean(value)),
    [entries]
  );

  const hasColumns = columns.length > 0;

  return (
    <div className="shop-page search-page">
      <Navbar
        sticky
        showSectionLinks={false}
        compactSearch
        onMenuToggle={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="shop-page__content ng-mobile-shell">
        <SectionTitle
          title="Compare rituals & products"
          subtitle="Line up focus, textures, and prices to decide the perfect ritual."
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
                    Remove
                  </button>
                </div>
                <div className="compare-column__body">
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Focus</p>
                    <div className="compare-column__chips">
                      {column.focus.map((value) => (
                        <span key={`${column.id}-focus-${value}`}>{value}</span>
                      ))}
                    </div>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Key benefits</p>
                    <p className="compare-column__row-value">
                      {Array.isArray(column.benefits) ? column.benefits.join(" • ") : column.benefits}
                    </p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Texture & scent</p>
                    <p className="compare-column__row-value">{column.texture.join(" • ")}</p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Usage</p>
                    <p className="compare-column__row-value">
                      {column.usage.length > 0 ? column.usage.join(" • ") : "Any ritual"}
                    </p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Included</p>
                    <p className="compare-column__row-value">{column.included.join(", ")}</p>
                  </div>
                  <div className="compare-column__row">
                    <p className="compare-column__row-label">Price</p>
                    <p className="compare-column__row-value">{column.priceLabel}</p>
                  </div>
                </div>
                <div className="compare-column__actions">
                  {column.type === "product" && column.detail && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        const detail = PRODUCT_DETAIL_MAP[column.detail!.productId];
                        if (detail) {
                          addItem(buildProductCartPayload(detail));
                          return;
                        }
                        addItem({
                          productId: column.detail!.productId,
                          id: column.detail!.productId,
                          name: column.detail!.productName,
                          price: column.detail!.priceNumber,
                          imageUrl: column.detail!.heroImage,
                        });
                      }}
                    >
                      {t("cta.addToBag")}
                    </Button>
                  )}
                  {column.type === "bundle" && column.bundle && (
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => addBundleToCart(column.bundle)}
                    >
                      {t("cta.addRitualToBag")}
                    </Button>
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
            <h3>No items selected</h3>
            <p>Add products or rituals to compare by tapping the compare toggle.</p>
            <div className="shop-product-card__actions">
              <Button variant="secondary" size="md" onClick={() => navigateTo("/shop")}>
                Browse shop
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
