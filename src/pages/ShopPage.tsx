import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { BundleCard } from "@/components/bundles/BundleCard";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { CompareToggle } from "@/components/CompareToggle";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import {
  shopCatalog,
  SHOP_FOCUS_TAGS,
  shopFocusLookup,
  shopOptionalLookup,
  type ShopCatalogBundleEntry,
  type ShopCatalogProductEntry,
  type FocusTagId,
} from "@/content/shopCatalog";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { getReviewStats } from "@/utils/reviewStorage";
import { RatingBadge } from "@/components/reviews/RatingBadge";
import { useTranslation } from "@/localization/locale";

const TYPE_FILTER_OPTIONS = [
  { id: "all", labelKey: "filters.allRitualsProducts" },
  { id: "product", labelKey: "filters.products" },
  { id: "bundle", labelKey: "sections.ritualBundles" },
] as const;

type ShopTypeFilter = (typeof TYPE_FILTER_OPTIONS)[number]["id"];

const getProductUrl = (slug: string) => {
  const base = import.meta.env.BASE_URL ?? "/";
  if (typeof window === "undefined") {
    const trimmed = base.endsWith("/") ? base.slice(0, -1) : base;
    return `${trimmed}/products/${slug}`;
  }
  const destination = new URL(base, window.location.origin);
  destination.pathname = `/products/${slug}`;
  return destination.toString();
};

export default function ShopPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [focusFilter, setFocusFilter] = useState<FocusTagId[]>([]);
  const [typeFilter, setTypeFilter] = useState<ShopTypeFilter>("all");
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { t } = useTranslation();

  const filteredCatalog = useMemo(() => {
    return shopCatalog.filter((entry) => {
      if (typeFilter !== "all" && entry.kind !== typeFilter) {
        return false;
      }
      if (focusFilter.length === 0) {
        return true;
      }
      return focusFilter.some((focus) => entry.focus.includes(focus));
    });
  }, [focusFilter, typeFilter]);

  const productEntries = filteredCatalog.filter(
    (entry): entry is ShopCatalogProductEntry => entry.kind === "product"
  );
  const bundleEntries = filteredCatalog.filter(
    (entry): entry is ShopCatalogBundleEntry => entry.kind === "bundle"
  );

  const hasActiveFilters =
    focusFilter.length > 0 || typeFilter !== "all";

  const toggleFocus = (id: FocusTagId) => {
    setFocusFilter((prev) =>
      prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id]
    );
  };

  const clearFilters = () => {
    setFocusFilter([]);
    setTypeFilter("all");
  };

  const handleAddProduct = (product: ShopCatalogProductEntry["item"]) => {
    addItem({
      productId: product.productId,
      id: product.productId,
      name: product.productName,
      price: product.priceNumber,
      imageUrl: product.heroImage,
    });
  };

  return (
    <div className="shop-page">
      <Navbar
        sticky
        showSectionLinks={false}
        compactSearch
        onMenuToggle={() => setSidebarOpen(true)}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="shop-page__content ng-mobile-shell">
        <SectionTitle
          title="Shop all rituals & products"
          subtitle="Every product and bundle lives here. Filter by focus or type to find the ritual that fits your day."
          align="center"
        />

        <div className="shop-filters" data-animate="fade-up">
          <div className="shop-filter__group">
            <p className="shop-filter__label">Focus</p>
            <div className="shop-filter__row">
              {SHOP_FOCUS_TAGS.map((tag) => {
                const isActive = focusFilter.includes(tag.id);
                return (
                  <button
                    type="button"
                    key={tag.id}
                    className={`shop-filter-pill${isActive ? " is-active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => toggleFocus(tag.id)}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shop-filter__group">
            <p className="shop-filter__label">Type</p>
              <div className="shop-filter__row">
                {TYPE_FILTER_OPTIONS.map((option) => {
                  const isActive = typeFilter === option.id;
                  const label = t(option.labelKey);
                  return (
                    <button
                      type="button"
                      key={option.id}
                    className={`shop-filter-pill${isActive ? " is-active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => setTypeFilter(option.id)}
                    >
                      {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="shop-filter__meta">
            <p>
              {hasActiveFilters
                ? "Filters applied — refine further or clear to see everything."
                : "Browse everything or use the filters to focus on a concern."}
            </p>
          <Button
            variant="ghost"
            size="sm"
            className="shop-filter-clear"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
          >
            {t("cta.clearFilters")}
          </Button>
          </div>
        </div>

        <section className="shop-results">
          {productEntries.length > 0 && (
            <div className="shop-results__group" data-animate="fade-up">
              <div className="shop-results__header">
                <h3>Products</h3>
                <p>Individual essentials to mix into your daily ritual.</p>
              </div>
              <div className="shop-product-grid ng-grid-mobile-2">
                {productEntries.map((entry) => {
                  const { item, focus, extras } = entry;
                  const focusLabels = focus.map((label) => shopFocusLookup[label]);
                  const extraLabels = extras?.map((label) => shopOptionalLookup[label]) ?? [];
                  const ratingStats = getReviewStats(item.productId, "product");
                  return (
                    <Card
                      key={item.productId}
                      className="shop-product-card hover-lift"
                      data-animate="fade-up"
                    >
                      <CompareToggle id={item.productId} type="product" />
                      <FavoriteToggle id={item.productId} type="product" />
                      {item.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={item.heroImage} alt={item.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{item.productName}</h3>
                          <p className="shop-product-card__price">{item.priceLabel}</p>
                        </div>
                        <p className="shop-product-card__tagline">{item.shortTagline}</p>
                        {ratingStats.count > 0 && (
                          <div className="shop-product-card__rating">
                            <RatingBadge
                              average={ratingStats.average}
                              count={ratingStats.count}
                            />
                          </div>
                        )}
                        <div className="shop-product-card__chips">
                          {focusLabels.map((label) => (
                            <span
                              key={`focus-${label}`}
                              className="shop-product-card__chip shop-product-card__chip--focus"
                            >
                              {label}
                            </span>
                          ))}
                          {extraLabels.map((label) => (
                            <span
                              key={`extra-${label}`}
                              className="shop-product-card__chip shop-product-card__chip--muted"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                        <div className="shop-product-card__actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAddProduct(item)}
                          >
                            {t("cta.addToBag")}
                          </Button>
                          <button
                            type="button"
                            className="shop-product-card__link"
                            onClick={() => {
                              window.location.href = getProductUrl(item.slug);
                            }}
                          >
                            {t("cta.viewRitual")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {bundleEntries.length > 0 && (
            <div className="shop-results__group" data-animate="fade-up">
              <div className="shop-results__header">
                <h3>{t("sections.ritualBundles")}</h3>
                <p>Cohesive sets that combine products for deeper rituals.</p>
              </div>
              <div className="shop-bundle-grid">
                {bundleEntries.map((entry) => {
                  const focusLabels = entry.focus.map((label) => shopFocusLookup[label]);
                  const extraLabels =
                    entry.extras?.map((label) => shopOptionalLookup[label]) ?? [];
                  const heroImage = getBundleHeroImage(entry.item.id);

                  return (
                    <div
                      key={entry.item.id}
                      className="shop-bundle-card"
                      data-animate="fade-up"
                    >
                      <div className="shop-bundle-card__chips">
                        {focusLabels.map((label) => (
                          <span
                            key={`focus-${label}`}
                            className="shop-bundle-card__chip shop-bundle-card__chip--focus"
                          >
                            {label}
                          </span>
                        ))}
                        {extraLabels.map((label) => (
                          <span
                            key={`extra-${label}`}
                            className="shop-bundle-card__chip shop-bundle-card__chip--muted"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                      <BundleCard
                        bundle={entry.item}
                        heroImage={heroImage}
                        onAddBundle={() => addBundleToCart(entry.item)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {filteredCatalog.length === 0 && (
            <div className="shop-empty-state" data-animate="fade-up">
              <h3>Nothing matches yet</h3>
              <p>
                Adjust your filter choices to discover other rituals. We keep every product
                and bundle here, so clearing filters brings everything back.
              </p>
          <Button variant="secondary" size="md" onClick={clearFilters}>
            {t("cta.resetFilters")}
          </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
