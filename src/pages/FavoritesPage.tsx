import { useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { BundleCard } from "@/components/bundles/BundleCard";
import { FavoriteToggle } from "@/components/FavoriteToggle";
import { CompareToggle } from "@/components/CompareToggle";
import { Button, Card, SectionTitle } from "@/components/ui";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import { useFavorites } from "@/favorites/favoritesStore";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { ritualBundles } from "@/content/bundles";
import { shopCatalog, shopFocusLookup, type FocusTagId } from "@/content/shopCatalog";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { formatCurrency } from "@/utils/formatCurrency";
import { useSeo } from "@/seo/useSeo";
import { useTranslation } from "@/localization/locale";
import { localizeProductDetail } from "@/content/productDetails";
import { useCurrency } from "@/currency/CurrencyProvider";

const navigateTo = (path: string) => {
  if (typeof window === "undefined") return;
  window.location.href = path;
};

export default function FavoritesPage() {
  usePageAnalytics("favorites");
  useSeo({ route: "favorites" });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { favorites } = useFavorites();
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { t, locale } = useTranslation();
  const { currency } = useCurrency();

  const focusMap = useMemo(() => {
    return shopCatalog.reduce<Record<string, FocusTagId[]>>((acc, entry) => {
      if (entry.kind === "product") {
        acc[entry.item.productId] = entry.focus;
      } else {
        acc[entry.item.id] = entry.focus;
      }
      return acc;
    }, {});
  }, []);

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

  const hasFavorites = favoriteProducts.length > 0 || favoriteBundles.length > 0;

  const focusLabels = (ids: FocusTagId[]) => ids.map((id) => shopFocusLookup[id]).filter(Boolean);

  const handleAddProduct = (detail: typeof favoriteProducts[number]) => {
    const payload = buildProductCartPayload(detail);
    addItem(payload);
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: detail.productId,
      quantity: 1,
      price: payload.price,
      variantId: payload.variantId,
      source: "favorites",
    });
  };

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
          title={t("favorites.title")}
        subtitle={t("favorites.subtitle")}
          align="center"
        />

        <section className="shop-results">
          {favoriteProducts.length > 0 && (
            <div className="shop-results__group" data-animate="fade-up">
              <div className="shop-results__header">
                <h3>{t("sections.products")}</h3>
                <p>{t("favorites.sections.products.subtitle")}</p>
              </div>
              <div className="shop-product-grid ng-grid-mobile-2">
                {favoriteProducts.map((detail) => {
                  const localizedDetail = localizeProductDetail(detail, locale);
                  return (
                    <Card
                      key={detail.productId}
                      className="shop-product-card hover-lift"
                      data-animate="fade-up"
                    >
                      <CompareToggle
                        id={detail.productId}
                        type="product"
                        itemLabel={localizedDetail.productName}
                      />
                      <FavoriteToggle
                        id={detail.productId}
                        type="product"
                        itemLabel={localizedDetail.productName}
                      />
                      {detail.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={detail.heroImage} alt={localizedDetail.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{localizedDetail.productName}</h3>
                          <p className="shop-product-card__price">
                            {formatCurrency(detail.priceNumber, currency)}
                          </p>
                        </div>
                        <p className="shop-product-card__tagline">{localizedDetail.shortTagline}</p>
                        <div className="shop-product-card__chips">
                          {focusLabels(focusMap[detail.productId] ?? []).map((label) => (
                            <span
                              key={`focus-${detail.productId}-${label}`}
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

          {favoriteBundles.length > 0 && (
            <div className="shop-results__group" data-animate="fade-up">
              <div className="shop-results__header">
                <h3>{t("favorites.sections.bundles.title")}</h3>
                <p>{t("favorites.sections.bundles.subtitle")}</p>
              </div>
              <div className="shop-bundle-grid ng-grid-mobile-2">
                {favoriteBundles.map((bundle) => (
                  <div
                    key={bundle.id}
                    className="shop-bundle-card"
                    data-animate="fade-up"
                  >
                    <div className="shop-bundle-card__chips">
                      {focusLabels(focusMap[bundle.id] ?? []).map((label) => (
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
                      viewSource="favorites"
                      heroImage={getBundleHeroImage(bundle.id)}
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasFavorites && (
            <div className="shop-empty-state">
              <h3>{t("favorites.empty.title")}</h3>
              <p>{t("favorites.empty.body")}</p>
              <div className="shop-product-card__actions">
                <Button variant="secondary" size="md" onClick={() => navigateTo("/shop")}>
                  {t("cta.browseShop")}
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
