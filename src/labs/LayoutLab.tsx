import { Button, Card, SectionTitle } from "../components/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import OfflineNotice from "@/components/OfflineNotice";
import Sidebar from "../components/Sidebar";
import CardGrid from "../components/CardGrid";
import ReviewsSection from "../components/ReviewsSection";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import collectionImage from "../assets/collection.png";
import iconLeft from "../assets/NaturaGloss_shiny_gold_icon_left.webp";
import iconMiddle from "../assets/NaturaGloss_shiny_gold_icon_middle.webp";
import iconRight from "../assets/NaturaGloss_shiny_gold_icon_right.webp";
import { PRODUCT_INDEX } from "../data/products";
import { addCartItem, readCart, subscribeToCart, writeCart, type CartItem } from "../utils/cartStorage";
import type { CatalogProduct } from "@/data/products";
import type { ProductDetailContent } from "@/content/productDetails";
import { BundleCard } from "../components/bundles/BundleCard";
import { ritualBundles } from "../content/bundles";
import { useBundleActions } from "../cart/cartBundles";
import { getBundleHeroImage } from "../content/bundleHeroImages";
import { useCart } from "@/cart/cartStore";
import { usePersonalizationData } from "@/content/personalization";
import { ritualGuides } from "@/content/ritualGuides";
import { getShopFocusLookup } from "@/content/shopCatalog";
import { AppTranslationKey, useTranslation } from "@/localization/locale";
import { primaryNav } from "@/config/navigation";
import { normalizeHref } from "@/utils/navigation";
import { formatCurrency } from "@/utils/formatCurrency";
import { useCurrency } from "@/currency/CurrencyProvider";

function formatSavedDate(value: string, t: (key: AppTranslationKey) => string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return t("common.recent");
  return new Date(parsed).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface LayoutLabProps {
  onCartOpen?: () => void;
}

export default function LayoutLab({ onCartOpen }: LayoutLabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const { t, locale } = useTranslation();
  const { currency } = useCurrency();
  const focusLookup = useMemo(() => getShopFocusLookup(locale), [locale]);
  const quickHeroActions = [
    { navId: "collection", labelKey: "cta.shopCollection", variant: "primary" as const },
    { navId: "finder", labelKey: "cta.findMyProduct", variant: "ghost" as const },
    { navId: "gift-builder", labelKey: "cta.buildAGift", variant: "ghost" as const },
  ];
  const handleQuickAction = useCallback((href: string) => {
    if (typeof window === "undefined") return;
    window.location.href = normalizeHref(href);
  }, []);

  const handleHeroPrefetch = (navId: string) => {
    if (navId === "finder") {
      prefetchRoute("/ritual-finder");
    } else if (navId === "gift-builder") {
      prefetchRoute("/gift-builder");
    }
  };

  useEffect(() => {
    writeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return subscribeToCart(setCartItems);
  }, []);

  const addItemToCart = useCallback((item: CatalogProduct) => {
    setCartItems((previous) => addCartItem(previous, item));
  }, []);

  const { addItem: addItemFromContext, loadSavedCart } = useCart();
  const { addBundleToCart } = useBundleActions();
  const {
    savedRituals,
    favoriteProducts,
    favoriteBundles,
    recentProducts,
    recentBundles,
    preferenceHighlights,
  } = usePersonalizationData();

  const hasSavedRituals = savedRituals.length > 0;
  const hasFavoriteItems = favoriteProducts.length + favoriteBundles.length > 0;
  const hasRecentItems = recentProducts.length + recentBundles.length > 0;
  const showPersonalizationGuidance = !hasSavedRituals && !hasFavoriteItems && !hasRecentItems;
  const showPersonalizationSection =
    hasSavedRituals || hasFavoriteItems || hasRecentItems || showPersonalizationGuidance;

  const handleAddPersonalizedProduct = useCallback(
    (detail: ProductDetailContent) => {
      addItemFromContext({
        id: detail.productId,
        name: detail.productName,
        price: detail.priceNumber,
        imageUrl: detail.heroImage,
      });
    },
    [addItemFromContext]
  );

  const handleLoadSavedRitual = useCallback(
    (id: string) => {
      loadSavedCart(id);
    },
    [loadSavedCart]
  );

  const goToProductDetail = useCallback((slug: string) => {
    if (typeof window === "undefined") return;
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = `/products/${slug}`;
    window.location.href = destination.toString();
  }, []);

  const navigateToPath = useCallback((path: string) => {
    if (typeof window === "undefined") return;
    const base = import.meta.env.BASE_URL ?? "/";
    const destination = new URL(base, window.location.origin);
    destination.pathname = path;
    window.location.href = destination.toString();
  }, []);

  const featuredGuides = ritualGuides.filter((guide) => guide.featured);
  const teaserGuides = featuredGuides.length > 0 ? featuredGuides.slice(0, 2) : ritualGuides.slice(0, 2);

  const handleAddToCart = useCallback(
    (item: CatalogProduct) => {
      addItemToCart(item);
    },
    [addItemToCart]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const addProductById = useCallback(
    (id: number) => {
      const product = PRODUCT_INDEX[id];
      if (product) {
        addItemToCart(product);
      }
    },
    [addItemToCart]
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      const { type, payload } = event.data ?? {};
      if (type === "ADD_RITUAL_TO_CART" && Array.isArray(payload?.productIds)) {
        payload.productIds.forEach((productId: number) => addProductById(productId));
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [addProductById]);

  const featuredBundles = ritualBundles.filter((bundle) => bundle.featured);

  const highlightFocusLabel = preferenceHighlights?.focus
    ? t(`onboarding.options.concerns.${preferenceHighlights.focus}.label` as AppTranslationKey)
    : undefined;
  const highlightTimeLabel = preferenceHighlights?.time
    ? t(`onboarding.options.time.${preferenceHighlights.time}.label` as AppTranslationKey)
    : undefined;
  const highlightScentLabel = preferenceHighlights?.scent
    ? t(`onboarding.options.scent.${preferenceHighlights.scent}.label` as AppTranslationKey)
    : undefined;
  const hasPreferenceHighlights =
    Boolean(preferenceHighlights) &&
    (preferenceHighlights?.bundles.length > 0 || preferenceHighlights?.products.length > 0);
  const highlightBundles = preferenceHighlights?.bundles ?? [];
  const highlightProducts = preferenceHighlights?.products ?? [];
  const highlightSummary = [highlightFocusLabel, highlightTimeLabel, highlightScentLabel]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="landing-page">
      <Navbar
        sticky
        onMenuToggle={() => setDrawerOpen(true)}
        menuOpen={drawerOpen}
        cartCount={totalItems}
        onCartOpen={onCartOpen}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <OfflineNotice />

      <main id="main-content" tabIndex={-1} className="landing-hero ng-mobile-shell" data-animate="fade-up">
        <div className="landing-hero__copy">
          <SectionTitle
            title={t("landing.hero.title")}
            subtitle={t("landing.hero.subtitle")}
            align="center"
            className="landing-hero__title"
            as="h1"
          />
          <div className="landing-hero__actions">
            <Button
              variant="primary"
              size="lg"
              onMouseEnter={() => prefetchRoute("/ritual-finder")}
              onFocus={() => prefetchRoute("/ritual-finder")}
              onClick={() => (window.location.href = "/ritual-finder")}
            >
              {t("cta.findYourRitual")}
            </Button>
            <Button variant="ghost" size="lg" onClick={() => navigateToPath("/onboarding")}>
              {t("cta.createRitualProfile")}
            </Button>
          </div>
          <div className="landing-hero__quick-actions">
            {quickHeroActions.map((action) => {
              const navItem = primaryNav.find((entry) => entry.id === action.navId);
              if (!navItem) return null;
              return (
                <Button
                  key={action.navId}
                  variant={action.variant}
                  size="lg"
                  onMouseEnter={() => handleHeroPrefetch(action.navId)}
                  onFocus={() => handleHeroPrefetch(action.navId)}
                  onClick={() => handleQuickAction(navItem.href)}
                >
                  {t(action.labelKey as AppTranslationKey)}
                </Button>
              );
            })}
          </div>
        </div>
        <figure className="landing-hero__media" data-animate="fade-in" data-parallax="hero">
          <img
            src={collectionImage}
            alt={t("landing.hero.imageAlt")}
            width="720"
            height="480"
            loading="eager"
            decoding="async"
          />
        </figure>
      </main>
      {teaserGuides.length > 0 && (
        <section className="landing-guides-teaser ng-mobile-shell" data-animate="fade-up">
          <div className="landing-guides-teaser__header">
            <p className="landing-guides-teaser__eyebrow">{t("sections.ritualGuides")}</p>
            <SectionTitle
              title={t("landing.guides.title")}
              subtitle={t("landing.guides.subtitle")}
              align="center"
              className="landing-guides-teaser__title"
            />
            <div className="landing-guides-teaser__actions">
              <Button variant="ghost" size="md" onClick={() => navigateToPath("/ritual-guides")}>
                {t("cta.viewAllGuides")}
              </Button>
            </div>
          </div>
          <div className="landing-guides-teaser__grid ng-grid-mobile-4">
            {teaserGuides.map((guide) => {
              const tags = [
                ...(guide.tags ?? []),
                ...(guide.focusTags ?? []).map((id) => focusLookup[id]).filter(Boolean),
              ];
              return (
                <Card key={guide.id} className="landing-guides-card hover-lift" data-animate="fade-up">
                  {guide.heroImage && (
                    <div className="landing-guides-card__media">
                      <img src={guide.heroImage} alt={guide.title} />
                    </div>
                  )}
                  <div className="landing-guides-card__body">
                    <p className="landing-guides-card__subtitle">{guide.subtitle}</p>
                    <h3>{guide.title}</h3>
                    <div className="landing-guides-card__tags">
                      {tags.map((tag) => (
                        <span key={`${guide.id}-${tag}`} className="landing-guides-card__tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="landing-guides-card__actions">
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => navigateToPath(`/ritual-guides/${guide.slug}`)}
                  >
                    {t("cta.readGuide")}
                  </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>
      )}
      {showPersonalizationSection && (
        <section className="landing-personalization ng-mobile-shell" data-animate="fade-up">
          <div className="landing-personalization__intro">
            <p className="landing-personalization__eyebrow">{t("sections.yourRituals")}</p>
            <SectionTitle
              title={t("sections.yourRituals")}
              subtitle={t("landing.personalization.subtitle")}
              align="center"
              className="landing-personalization__title"
            />
          </div>

          {hasPreferenceHighlights && (
            <article
              className="landing-personalization__group landing-personalization__group--focus"
              data-animate="fade-up"
            >
              <div className="landing-personalization__group-title">
                <h3>{t("onboarding.personalization.title")}</h3>
                <p>{t("onboarding.personalization.description")}</p>
                {highlightSummary && (
                  <p className="landing-personalization__focus-meta">{highlightSummary}</p>
                )}
              </div>
              {highlightBundles.length > 0 && (
                <div className="landing-personalization__bundle-grid ng-grid-mobile-2">
                  {highlightBundles.map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                      heroImage={getBundleHeroImage(bundle.id)}
                    />
                  ))}
                </div>
              )}
              {highlightProducts.length > 0 && (
                <div className="landing-personalization__product-grid ng-grid-mobile-2">
                  {highlightProducts.map((detail) => (
                    <Card
                      key={detail.productId}
                      className="shop-product-card landing-personalization__product-card"
                    >
                      {detail.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={detail.heroImage} alt={detail.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{detail.productName}</h3>
                          <p className="shop-product-card__price">
                            {formatCurrency(detail.priceNumber, currency)}
                          </p>
                        </div>
                        <p className="shop-product-card__tagline">{detail.shortTagline}</p>
                        <div className="shop-product-card__actions landing-personalization__product-actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAddPersonalizedProduct(detail)}
                          >
                            {t("cta.addToBag")}
                          </Button>
                          <button
                            type="button"
                            className="shop-product-card__link"
                            onClick={() => goToProductDetail(detail.slug)}
                          >
                            {t("cta.viewRitual")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            <div className="landing-personalization__focus-actions">
              <Button variant="ghost" size="md" onClick={() => navigateToPath("/onboarding")}>
                {t("onboarding.personalization.updateLink")}
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigateToPath("/ritual-coach")}>
                {t("ritualCoach.cta.askCoach")}
              </Button>
            </div>
          </article>
        )}

          {hasSavedRituals && (
            <article className="landing-personalization__group" data-animate="fade-up">
              <div className="landing-personalization__group-title">
                <h3>{t("sections.yourSavedRituals")}</h3>
                <p>{t("landing.savedRituals.subtitle")}</p>
              </div>
              <div className="landing-personalization__saved-grid">
                {savedRituals.map((ritual) => (
                  <Card key={ritual.id} className="landing-personalization__saved-card">
                    <div>
                      {(() => {
                        const itemLabel =
                          ritual.itemCount === 1 ? t("common.item") : t("common.items");
                        const moreCount = ritual.items.length - 3;
                        const moreLabel =
                          moreCount === 1 ? t("common.moreItem") : t("common.moreItems");
                        return (
                          <>
                      <p className="landing-personalization__saved-name">{ritual.name}</p>
                      <p className="landing-personalization__saved-meta">
                              {ritual.itemCount} {itemLabel} · {t("common.lastUpdated")}{" "}
                              {formatSavedDate(ritual.updatedAt, t)}
                      </p>
                      <ul className="landing-personalization__saved-items">
                        {ritual.items.slice(0, 3).map((item) => (
                          <li key={`${ritual.id}-${item.id}`}>
                            {item.name} × {item.quantity}
                          </li>
                        ))}
                      </ul>
                      {ritual.items.length > 3 && (
                        <p className="landing-personalization__saved-more">
                                +{moreCount} {moreLabel}
                        </p>
                      )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="landing-personalization__saved-actions">
                      <Button variant="secondary" size="md" onClick={() => handleLoadSavedRitual(ritual.id)}>
                        {t("cta.resumeRitual")}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </article>
          )}

          {hasFavoriteItems && (
            <article className="landing-personalization__group" data-animate="fade-up">
              <div className="landing-personalization__group-title">
                <h3>{t("sections.yourFavourites")}</h3>
                <p>{t("landing.favorites.subtitle")}</p>
              </div>
              {favoriteProducts.length > 0 && (
                <div className="landing-personalization__product-grid">
                  {favoriteProducts.map((detail) => (
                    <Card
                      key={detail.productId}
                      className="shop-product-card landing-personalization__product-card"
                    >
                      {detail.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={detail.heroImage} alt={detail.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{detail.productName}</h3>
                          <p className="shop-product-card__price">
                            {formatCurrency(detail.priceNumber, currency)}
                          </p>
                        </div>
                        <p className="shop-product-card__tagline">{detail.shortTagline}</p>
                        <div className="shop-product-card__actions landing-personalization__product-actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAddPersonalizedProduct(detail)}
                          >
                            {t("cta.addToBag")}
                          </Button>
                          <button
                            type="button"
                            className="shop-product-card__link"
                            onClick={() => goToProductDetail(detail.slug)}
                          >
                            {t("cta.viewRitual")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {favoriteBundles.length > 0 && (
                <div className="landing-personalization__bundle-grid">
                  {favoriteBundles.map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                      heroImage={getBundleHeroImage(bundle.id)}
                    />
                  ))}
                </div>
              )}
            </article>
          )}

          {hasRecentItems && (
            <article className="landing-personalization__group" data-animate="fade-up">
              <div className="landing-personalization__group-title">
                <h3>{t("sections.recentlyViewed")}</h3>
                <p>{t("landing.recent.subtitle")}</p>
              </div>
              {recentProducts.length > 0 && (
                <div className="landing-personalization__product-grid">
                  {recentProducts.map((detail) => (
                    <Card
                      key={detail.productId}
                      className="shop-product-card landing-personalization__product-card"
                    >
                      {detail.heroImage && (
                        <div className="shop-product-card__media">
                          <img src={detail.heroImage} alt={detail.productName} />
                        </div>
                      )}
                      <div className="shop-product-card__body">
                        <div className="shop-product-card__heading">
                          <h3>{detail.productName}</h3>
                          <p className="shop-product-card__price">
                            {formatCurrency(detail.priceNumber, currency)}
                          </p>
                        </div>
                        <p className="shop-product-card__tagline">{detail.shortTagline}</p>
                        <div className="shop-product-card__actions landing-personalization__product-actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => handleAddPersonalizedProduct(detail)}
                          >
                            {t("cta.addToBag")}
                          </Button>
                          <button
                            type="button"
                            className="shop-product-card__link"
                            onClick={() => goToProductDetail(detail.slug)}
                          >
                            {t("cta.viewRitual")}
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              {recentBundles.length > 0 && (
                <div className="landing-personalization__bundle-grid">
                  {recentBundles.map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                      heroImage={getBundleHeroImage(bundle.id)}
                    />
                  ))}
                </div>
              )}
            </article>
          )}
          {showPersonalizationGuidance && (
            <div className="landing-personalization__guidance" data-animate="fade-up">
              <p className="landing-personalization__guidance-eyebrow">
                {t("sections.newHere")}
              </p>
              <h3>{t("landing.guidance.title")}</h3>
              <p>{t("landing.guidance.body")}</p>
              <div className="landing-personalization__guidance-actions">
                <Button variant="secondary" size="lg" onClick={() => navigateToPath("/ritual-finder")}>
                  {t("cta.helpChooseRitual")}
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigateToPath("/shop")}>
                  {t("cta.browseRitualsProducts")}
                </Button>
              </div>
            </div>
          )}
        </section>
        )}
      <section
        className="landing-stories ng-mobile-shell"
        aria-labelledby="landing-stories-title"
        data-animate="fade-up"
      >
          <div className="landing-stories__content">
          <p className="landing-stories__eyebrow">{t("sections.theRitualJournal")}</p>
          <SectionTitle
            title={t("nav.journal")}
            subtitle={t("landing.journal.subtitle")}
            align="center"
            className="landing-stories__title"
          />
          <div className="landing-stories__actions">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => (window.location.href = "/stories")}
            >
              {t("nav.journal")}
            </Button>
          </div>
        </div>
      </section>

      <section className="landing-values ng-mobile-shell">
        <h2 data-animate="fade-up">{t("landing.values.title")}</h2>
        <div className="landing-values__grid">
          <article data-animate="fade-in">
            <img src={iconLeft} alt="" aria-hidden="true" />
            <h3>{t("landing.values.cards.smallBatch.title")}</h3>
            <p>{t("landing.values.cards.smallBatch.body")}</p>
          </article>
          <article data-animate="fade-in">
            <img src={iconMiddle} alt="" aria-hidden="true" />
            <h3>{t("landing.values.cards.transparency.title")}</h3>
            <p>{t("landing.values.cards.transparency.body")}</p>
          </article>
          <article data-animate="fade-in">
            <img src={iconRight} alt="" aria-hidden="true" />
            <h3>{t("landing.values.cards.standards.title")}</h3>
            <p>{t("landing.values.cards.standards.body")}</p>
          </article>
        </div>
      </section>

      <div className="legacy-section">
        <div className="container legacy-content ng-mobile-shell">
          <section className="hero legacy-hero-intro" id="about">
            <h1 data-animate="fade-up">NaturaGloss</h1>
            <p data-animate="fade-up">{t("landing.legacy.body")}</p>
          </section>

          <CardGrid
            onAddToCart={handleAddToCart}
          />
          {featuredBundles.length > 0 && (
            <section className="landing-bundles" data-animate="fade-up">
              <SectionTitle
                title={t("sections.ritualBundles")}
                subtitle={t("landing.bundles.subtitle")}
                align="center"
                className="landing-bundles__title"
              />
            <div className="bundle-grid ng-grid-mobile-2">
              {featuredBundles.map((bundle) => (
                <BundleCard
                  key={bundle.id}
                  bundle={bundle}
                  onAddBundle={(bundleItem, variantSelection) =>
                    addBundleToCart(bundleItem, variantSelection)
                  }
                  heroImage={getBundleHeroImage(bundle.id)}
                />
              ))}
            </div>
            </section>
          )}
        </div>
      </div>

      <ReviewsSection />
    </div>
  );
}
