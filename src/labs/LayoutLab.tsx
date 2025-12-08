import { Button, Card, SectionTitle } from "../components/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CardGrid from "../components/CardGrid";
import ReviewsSection from "../components/ReviewsSection";
import collectionImage from "../assets/collection.png";
import iconLeft from "../assets/NaturaGloss_shiny_gold_icon_left.webp";
import iconMiddle from "../assets/NaturaGloss_shiny_gold_icon_middle.webp";
import iconRight from "../assets/NaturaGloss_shiny_gold_icon_right.webp";
import { PRODUCT_INDEX } from "../data/products";
import { addCartItem, readCart, subscribeToCart, writeCart, type CartItem } from "../utils/cartStorage";
import type { Product } from "../types/product";
import type { ProductDetailContent } from "@/content/productDetails";
import { BundleCard } from "../components/bundles/BundleCard";
import { ritualBundles } from "../content/bundles";
import { useBundleActions } from "../cart/cartBundles";
import { getBundleHeroImage } from "../content/bundleHeroImages";
import { useCart } from "@/cart/cartStore";
import { usePersonalizationData } from "@/content/personalization";
import { ritualGuides } from "@/content/ritualGuides";
import { shopFocusLookup } from "@/content/shopCatalog";
import { AppTranslationKey, useTranslation } from "@/localization/locale";
import { primaryNav } from "@/config/navigation";
import { normalizeHref } from "@/utils/navigation";

function formatSavedDate(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return "Recent";
  return new Date(parsed).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const ANNOUNCEMENTS = [
  { id: 0, text: "Because your body deserves natural luxury", className: "announcement-message--secondary" },
  { id: 1, text: "Inspired by European cosmetic standards, handcrafted in Egypt", className: "announcement-message--primary" },
];

interface LayoutLabProps {
  onCartOpen?: () => void;
}

export default function LayoutLab({ onCartOpen }: LayoutLabProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => readCart());
  const [activeAnnouncement, setActiveAnnouncement] = useState(1);
  const rotationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const announcementCount = ANNOUNCEMENTS.length || 1;
  const { t } = useTranslation();
  const quickHeroActions = [
    { navId: "collection", labelKey: "cta.shopCollection", variant: "primary" as const },
    { navId: "finder", labelKey: "cta.findMyProduct", variant: "ghost" as const },
    { navId: "gift-builder", labelKey: "cta.buildAGift", variant: "ghost" as const },
  ];
  const handleQuickAction = useCallback((href: string) => {
    if (typeof window === "undefined") return;
    window.location.href = normalizeHref(href);
  }, []);

  const restartRotation = useCallback(() => {
    if (rotationRef.current) {
      clearInterval(rotationRef.current);
    }
    rotationRef.current = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcementCount);
    }, 5000);
  }, [announcementCount]);

  useEffect(() => {
    restartRotation();
    return () => {
      if (rotationRef.current) clearInterval(rotationRef.current);
    };
  }, [restartRotation]);

  useEffect(() => {
    writeCart(cartItems);
  }, [cartItems]);

  useEffect(() => {
    return subscribeToCart(setCartItems);
  }, []);

  const showPrevAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev - 1 + announcementCount) % announcementCount);
    restartRotation();
  };

  const showNextAnnouncement = () => {
    setActiveAnnouncement((prev) => (prev + 1) % announcementCount);
    restartRotation();
  };

  const addItemToCart = useCallback((item: Product) => {
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
    (item: Product) => {
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
      <div className="legacy-announcement">
        <div className="announcement-bar" role="status" aria-live="polite">
          <button
            type="button"
            className="announcement-nav announcement-nav--prev"
            aria-label="Previous announcement"
            onClick={showPrevAnnouncement}
          >
            <span aria-hidden="true">‹</span>
          </button>
          <div className="announcement-track">
            {ANNOUNCEMENTS.map((announcement, index) => (
              <span
                key={announcement.id}
                className={`announcement-message ${announcement.className ?? ""} ${index === activeAnnouncement ? "is-active" : ""}`}
              >
                {announcement.text}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="announcement-nav announcement-nav--next"
            aria-label="Next announcement"
            onClick={showNextAnnouncement}
          >
            <span aria-hidden="true">›</span>
          </button>
        </div>
      </div>
      <Navbar
        sticky
        onMenuToggle={() => setDrawerOpen(true)}
        cartCount={totalItems}
        onCartOpen={onCartOpen}
      />
      <Sidebar open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <main className="landing-hero ng-mobile-shell" data-animate="fade-up">
        <div className="landing-hero__copy">
          <SectionTitle
            title="Luxury Inspired by Nature’s Essence"
            subtitle="Indulge in a world of serenity and sophistication, natural care designed for those who value beauty with soul."
            align="center"
            className="landing-hero__title"
          />
          <div className="landing-hero__actions">
            <Button
              variant="primary"
              size="lg"
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
                  onClick={() => handleQuickAction(navItem.href)}
                >
                  {t(action.labelKey as AppTranslationKey)}
                </Button>
              );
            })}
          </div>
        </div>
        <figure className="landing-hero__media" data-animate="fade-in" data-parallax="hero">
          <img src={collectionImage} alt="NaturaGloss collection of botanical care" />
        </figure>
      </main>
      {teaserGuides.length > 0 && (
        <section className="landing-guides-teaser ng-mobile-shell" data-animate="fade-up">
          <div className="landing-guides-teaser__header">
            <p className="landing-guides-teaser__eyebrow">{t("sections.ritualGuides")}</p>
            <SectionTitle
              title="Editorial routines & notes"
              subtitle="Gentle essays and deep dives for every layer of care."
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
                ...(guide.focusTags ?? []).map((id) => shopFocusLookup[id]).filter(Boolean),
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
              subtitle="Saved, loved, or simply recently admired—this space remembers each pause."
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
                          {detail.priceLabel && (
                            <p className="shop-product-card__price">{detail.priceLabel}</p>
                          )}
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
                <p>Pick up the bundles you kept for a rainy night or a luminous morning.</p>
              </div>
              <div className="landing-personalization__saved-grid">
                {savedRituals.map((ritual) => (
                  <Card key={ritual.id} className="landing-personalization__saved-card">
                    <div>
                      <p className="landing-personalization__saved-name">{ritual.name}</p>
                      <p className="landing-personalization__saved-meta">
                        {ritual.itemCount} item{ritual.itemCount === 1 ? "" : "s"} · Last updated{" "}
                        {formatSavedDate(ritual.updatedAt)}
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
                          +{ritual.items.length - 3} more item
                          {ritual.items.length - 3 === 1 ? "" : "s"}
                        </p>
                      )}
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
                <p>Products and rituals you marked to revisit.</p>
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
                          {detail.priceLabel && (
                            <p className="shop-product-card__price">{detail.priceLabel}</p>
                          )}
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
                <p>Gentle reminders of what caught your eye recently.</p>
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
                          {detail.priceLabel && (
                            <p className="shop-product-card__price">{detail.priceLabel}</p>
                          )}
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
              <h3>Begin your routine story</h3>
              <p>
                Explore the Routine Finder for a curated path, or browse the shop for every ingredient that
                sparks calm.
              </p>
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
            title="Our Journal"
            subtitle="Slow, sensory routines captured in words—read how botanicals, breath, and intention guide each evening, morning, and pause."
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
        <h2 data-animate="fade-up">Why Choose NaturaGloss</h2>
        <div className="landing-values__grid">
          <article data-animate="fade-in">
            <img src={iconLeft} alt="" aria-hidden="true" />
            <h3>Small-Batch Quality</h3>
            <p>
              Handcrafted in limited runs to ensure every bar and balm is fresh and carefully made.
            </p>
          </article>
          <article data-animate="fade-in">
            <img src={iconMiddle} alt="" aria-hidden="true" />
            <h3>Ingredient Transparency</h3>
            <p>
              Every ingredient fully listed — no hidden chemicals, just pure botanicals.
            </p>
          </article>
          <article data-animate="fade-in">
            <img src={iconRight} alt="" aria-hidden="true" />
            <h3>EU-Inspired Standards</h3>
            <p>
              Formulated with guidance from European cosmetic safety and quality practices.
            </p>
          </article>
        </div>
      </section>

      <div className="legacy-section">
        <div className="container legacy-content ng-mobile-shell">
          <section className="hero legacy-hero-intro" id="about">
            <h1 data-animate="fade-up">NaturaGloss</h1>
            <p data-animate="fade-up">
              Elevate your daily ritual with nutrient-rich botanicals and luminous finishes, crafted
              in small batches for those who seek intentional, radiant self-care.
            </p>
          </section>

          <CardGrid
            onAddToCart={handleAddToCart}
          />
          {featuredBundles.length > 0 && (
            <section className="landing-bundles" data-animate="fade-up">
              <SectionTitle
                title={t("sections.ritualBundles")}
                subtitle="Curated sets that weave products together for one elevated moment."
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
