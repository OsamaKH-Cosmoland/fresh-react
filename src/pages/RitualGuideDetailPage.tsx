import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { Button, Card, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { useBundleActions } from "@/cart/cartBundles";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { ritualBundles } from "@/content/bundles";
import { getBundleHeroImage } from "@/content/bundleHeroImages";
import { getRitualGuideBySlug } from "@/content/ritualGuides";
import { shopFocusLookup } from "@/content/shopCatalog";
import { useTranslation } from "@/localization/locale";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { formatCurrency } from "@/utils/formatCurrency";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { useSeo } from "@/seo/useSeo";
import { buildAppUrl } from "@/utils/navigation";
import { useCurrency } from "@/currency/CurrencyProvider";

const navigateTo = (path: string) => {
  if (typeof window === "undefined") return;
  const base = import.meta.env.BASE_URL ?? "/";
  const destination = new URL(base, window.location.origin);
  destination.pathname = path;
  window.location.href = destination.toString();
};

export interface RitualGuideDetailPageProps {
  slug: string;
}

export default function RitualGuideDetailPage({ slug }: RitualGuideDetailPageProps) {
  usePageAnalytics("guide_detail");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const guide = useMemo(() => getRitualGuideBySlug(slug), [slug]);
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { t } = useTranslation();
  const { currency } = useCurrency();
  const articleJsonLd = useMemo(() => {
    if (!guide) return undefined;
    const focusLabels = (guide.focusTags ?? [])
      .map((tag) => shopFocusLookup[tag])
      .filter(Boolean);
    return [
      {
        id: `guide-jsonld-${guide.id}`,
        data: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: guide.title,
          description: guide.subtitle,
          image: guide.heroImage,
          author: { "@type": "Organization", name: "NaturaGloss" },
          publisher: { "@type": "Organization", name: "NaturaGloss" },
          url: buildAppUrl(`/ritual-guides/${guide.slug}`),
          articleSection: focusLabels,
        },
      },
    ];
  }, [guide]);
  useSeo({
    route: "guide_detail",
    title: guide?.title,
    description: guide?.subtitle,
    canonicalPath: guide ? `/ritual-guides/${guide.slug}` : undefined,
    ogImageUrl: guide?.heroImage,
    jsonLd: articleJsonLd,
  });

  useEffect(() => {
    if (!guide) return;
    trackEvent({
      type: "view_guide",
      guideId: guide.id,
      source: "guides",
    });
  }, [guide?.id]);

  const relatedProducts = useMemo(
    () =>
      (guide?.relatedProducts ?? [])
        .map((productId) => PRODUCT_DETAIL_MAP[productId])
        .filter((entry): entry is typeof PRODUCT_DETAIL_MAP[string] => Boolean(entry)),
    [guide]
  );

  const relatedBundles = useMemo(
    () =>
      (guide?.relatedBundles ?? [])
        .map((bundleId) => ritualBundles.find((bundle) => bundle.id === bundleId))
        .filter((bundle): bundle is typeof ritualBundles[number] => Boolean(bundle)),
    [guide]
  );

  if (!guide) {
    return (
      <div className="ritual-guide-detail-page">
        <Navbar
          sticky
          onMenuToggle={() => setSidebarOpen(true)}
          showSectionLinks={false}
          menuOpen={sidebarOpen}
        />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main id="main-content" tabIndex={-1} className="ritual-guide-detail-page__content ng-mobile-shell">
          <SectionTitle title="Guide not found" align="center" />
          <p>The routine you are seeking has not yet been written.</p>
        </main>
      </div>
    );
  }

  const tagChips = [
    ...(guide.tags ?? []),
    ...(guide.focusTags ?? []).map((id) => shopFocusLookup[id]).filter(Boolean),
  ];

  return (
    <div className="ritual-guide-detail-page">
      <Navbar
        sticky
        onMenuToggle={() => setSidebarOpen(true)}
        showSectionLinks={false}
        menuOpen={sidebarOpen}
      />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main id="main-content" tabIndex={-1} className="ritual-guide-detail-page__content ng-mobile-shell">
        <section className="ritual-guide-hero" data-animate="fade-up">
          <div className="ritual-guide-hero__copy">
            <div className="ritual-guide-hero__tags">
              {tagChips.map((tag) => (
                <span key={`tag-${guide.id}-${tag}`}>{tag}</span>
              ))}
            </div>
            <h1>{guide.title}</h1>
            <p>{guide.subtitle}</p>
          </div>
          {guide.heroImage && (
            <figure className="ritual-guide-hero__media">
              <img src={guide.heroImage} alt={guide.title} />
              {guide.heroCaption && <figcaption>{guide.heroCaption}</figcaption>}
            </figure>
          )}
        </section>

        <section className="ritual-guide-body" data-animate="fade-up">
          {guide.body.map((block, index) => (
            <article key={`${guide.slug}-${index}`} className="ritual-guide-block">
              {block.title && <h3>{block.title}</h3>}
              {"paragraphs" in block &&
                block.paragraphs.map((text, paragraphIndex) => (
                  <p key={`${block.title ?? "block"}-${paragraphIndex}`}>{text}</p>
                ))}
              {"items" in block && (
                <ul>
                  {block.items.map((item) => (
                    <li key={`${guide.slug}-${item}`}>{item}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        {(relatedProducts.length > 0 || relatedBundles.length > 0) && (
          <section className="ritual-guide-related" data-animate="fade-up">
            <div className="ritual-guide-related__header">
              <SectionTitle
                title="Layer these routines"
                subtitle="Pair the guide with products and bundles that bring it to life."
                align="left"
              />
            </div>

            {relatedProducts.length > 0 && (
          <div className="ritual-guide-products ng-grid-mobile-2">
                {relatedProducts.map((detail) => (
                  <Card
                    key={detail.productId}
                    className="shop-product-card ritual-guide-product-card hover-lift"
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
                        <div className="shop-product-card__actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() => {
                              const payload = buildProductCartPayload(detail);
                              addItem(payload);
                              trackEvent({
                                type: "add_to_cart",
                                itemType: "product",
                                id: detail.productId,
                                quantity: 1,
                                price: payload.price,
                                variantId: payload.variantId,
                                source: "guide",
                              });
                            }}
                          >
                            {t("cta.addToBag")}
                          </Button>
                        <button
                          type="button"
                          className="shop-product-card__link"
                          onClick={() => navigateTo(`/products/${detail.slug}`)}
                        >
                          {t("cta.viewRitual")}
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {relatedBundles.length > 0 && (
            <div className="ritual-guide-bundles ng-grid-mobile-2">
                {relatedBundles.map((bundle) => (
                    <BundleCard
                      key={bundle.id}
                      bundle={bundle}
                      viewSource="guide"
                      onAddBundle={(bundleItem, variantSelection) =>
                        addBundleToCart(bundleItem, variantSelection)
                      }
                      heroImage={getBundleHeroImage(bundle.id)}
                    />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
