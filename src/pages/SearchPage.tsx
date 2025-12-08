import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { BundleCard } from "@/components/bundles/BundleCard";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { CompareToggle } from "@/components/CompareToggle";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import { filterSearchEntries } from "@/hooks/useGlobalSearch";
import type { ProductDetailContent } from "@/content/productDetails";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { ritualBundles } from "@/content/bundles";
import { shopFocusLookup } from "@/content/shopCatalog";
import { ritualGuides } from "@/content/ritualGuides";
import { getVariantSummary } from "@/content/productDetails";
import { getReviewStats } from "@/utils/reviewStorage";
import { RatingBadge } from "@/components/reviews/RatingBadge";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { useTranslation } from "@/localization/locale";

const getQueryFromLocation = () => {
  if (typeof window === "undefined") {
    return "";
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("q") ?? "";
};

const navigateTo = (path: string) => {
  if (typeof window === "undefined") {
    return;
  }
  window.location.href = path;
};

export default function SearchPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const query = getQueryFromLocation();
  const { t } = useTranslation();
  const handleAddProduct = (detail: ProductDetailContent) => {
    addItem(buildProductCartPayload(detail));
  };

  const searchResults = useMemo(
    () => filterSearchEntries(query, { allowEmpty: true }),
    [query]
  );

  const productResults = searchResults.filter((entry) => entry.kind === "product");
  const bundleResults = searchResults.filter((entry) => entry.kind === "bundle");
  const experienceResults = searchResults.filter((entry) => entry.kind === "experience");
  const guideResults = searchResults.filter((entry) => entry.kind === "guide");

  const products = productResults
    .map((entry) => {
      const detail = PRODUCT_DETAIL_MAP[entry.slug];
      if (!detail) return null;
      return { entry, detail };
    })
    .filter(
      (
        item
      ): item is { entry: (typeof productResults)[number]; detail: ProductDetailContent } =>
        Boolean(item)
    );

  const bundles = bundleResults
    .map((entry) => {
      const bundle = ritualBundles.find((item) => item.id === entry.bundleId);
      if (!bundle) return null;
      return { entry, bundle };
    })
    .filter(
      (
        item
      ): item is { entry: (typeof bundleResults)[number]; bundle: (typeof ritualBundles)[number] } =>
        Boolean(item)
    );

  const focusLabels = (focusIds: string[]) =>
    focusIds.map((id) => shopFocusLookup[id]).filter(Boolean);

  return (
    <div className="shop-page search-page">
      <Navbar sticky showSectionLinks={false} onMenuToggle={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="shop-page__content ng-mobile-shell">
        <SectionTitle
          title="Search rituals, products, or experiences"
          subtitle={
            query
              ? `Showing “${query}”. Refine the words or clear the field to see everything.`
              : "Browse every ritual. Use keywords, focus tags, or the Ritual Finder to guide you."
          }
          align="center"
        />

        <section className="shop-results">
          {products.length > 0 && (
            <div className="shop-results__group">
              <div className="shop-results__header">
                <h3>Products</h3>
                <p>Singles to slot into your daily care ritual.</p>
              </div>
              <div className="shop-product-grid">
                {products.map(({ entry, detail }) => {
                  const focusChips = focusLabels(entry.focus);
                  const variantSummary = getVariantSummary(detail.productId);
                  const variantLabels = variantSummary?.labels.slice(0, 3) ?? [];
                  const hasMoreVariants =
                    Boolean(variantSummary) && variantSummary.count > variantLabels.length;
                  const ratingStats = getReviewStats(detail.productId, "product");
                  return (
                    <Card
                      key={detail.productId}
                      className="shop-product-card hover-lift"
                      data-animate="fade-up"
                    >
                      <CompareToggle id={detail.productId} type="product" />
                      <FavoriteToggle id={detail.productId} type="product" />
                    {detail.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={detail.heroImage} alt={detail.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{detail.productName}</h3>
                          <p className="shop-product-card__price">{detail.priceLabel}</p>
                        </div>
                        <p className="shop-product-card__tagline">{detail.shortTagline}</p>
                        {variantSummary && variantSummary.count > 1 && (
                          <>
                            <p className="shop-product-card__variant-summary">
                              {t("variants.summary.available", {
                                count: variantSummary.count,
                              })}
                            </p>
                            <p className="shop-product-card__variant-list">
                              {variantLabels.join(" · ")}
                              {hasMoreVariants ? " …" : ""}
                            </p>
                          </>
                        )}
                        {ratingStats.count > 0 && (
                          <div className="shop-product-card__rating">
                            <RatingBadge average={ratingStats.average} count={ratingStats.count} />
                          </div>
                        )}
                        <div className="shop-product-card__chips">
                          {focusChips.map((label) => (
                            <span
                              key={`focus-${label}`}
                              className="shop-product-card__chip shop-product-card__chip--focus"
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                          <div className="shop-product-card__actions">
                            <Button
                              variant="primary"
                              size="md"
                              onClick={() => handleAddProduct(detail)}
                            >
                              {t("cta.addToBag")}
                            </Button>
                          <a
                            href={`/products/${detail.slug}`}
                            className="shop-product-card__link"
                          >
                            {t("cta.viewRitual")}
                          </a>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {guideResults.length > 0 && (
            <div className="shop-results__group">
              <div className="shop-results__header">
                <h3>Guides</h3>
                <p>Editorial rituals and essays for mindful care.</p>
              </div>
              <div className="shop-product-grid search-guides-grid">
                {guideResults
                  .map((entry) => {
                    const guide = ritualGuides.find((item) => item.slug === entry.slug);
                    if (!guide) return null;
                    return { entry, guide };
                  })
                  .filter((item): item is { entry: (typeof guideResults)[number]; guide: typeof ritualGuides[number] } => Boolean(item))
                  .map(({ guide }) => (
                    <Card
                      key={guide.id}
                      className="shop-product-card search-guide-card hover-lift"
                      data-animate="fade-up"
                    >
                      {guide.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={guide.heroImage} alt={guide.title} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{guide.title}</h3>
                        </div>
                        <p className="shop-product-card__tagline">{guide.subtitle}</p>
                      <div className="shop-product-card__actions">
                        <Button
                          variant="secondary"
                          size="md"
                          onClick={() => navigateTo(`/ritual-guides/${guide.slug}`)}
                        >
                          {t("cta.readGuide")}
                        </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {bundles.length > 0 && (
            <div className="shop-results__group">
              <div className="shop-results__header">
                <h3>Bundles</h3>
                <p>Cohesive rituals that combine your favorite items.</p>
              </div>
              <div className="shop-bundle-grid">
                {bundles.map(({ entry, bundle }) => (
                  <div
                    key={bundle.id}
                    className="shop-bundle-card"
                    data-animate="fade-up"
                  >
                    <div className="shop-bundle-card__chips">
                      {focusLabels(entry.focus).map((label) => (
                        <span
                          key={`focus-${bundle.id}-${label}`}
                          className="shop-bundle-card__chip shop-bundle-card__chip--focus"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                      <BundleCard
                        bundle={bundle}
                        onAddBundle={(bundleItem, variantSelection) =>
                          addBundleToCart(bundleItem, variantSelection)
                        }
                      />
                  </div>
                ))}
              </div>
            </div>
          )}

          {experienceResults.length > 0 && (
            <div className="shop-results__group">
              <div className="shop-results__header">
                <h3>Experiences</h3>
                <p>Guidance and rituals to inspire each moment.</p>
              </div>
              <div className="shop-bundle-grid">
                {experienceResults.map((entry) => (
                  <Card
                    key={entry.id}
                    className="bundle-card hover-lift"
                    data-animate="fade-up"
                  >
                    <header className="bundle-card__header">
                      <p className="bundle-card__tagline">{entry.tagline}</p>
                      <h3>{entry.label}</h3>
                    </header>
                    <div className="bundle-card__actions">
                      <Button
                        variant="secondary"
                        size="md"
                        onClick={() => navigateTo(entry.url)}
                      >
                        {t("cta.open")}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && (
            <div className="shop-empty-state">
              <h3>No matches found</h3>
              <p>
                Try a different term or visit the Shop and Ritual Finder for more guidance.
              </p>
              <div className="shop-product-card__actions">
                <Button variant="secondary" size="md" onClick={() => navigateTo("/shop")}>
                  {t("cta.goToShop")}
                </Button>
                <Button variant="ghost" size="md" onClick={() => navigateTo("/ritual-finder")}>
                  {t("cta.openRitualFinder")}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
