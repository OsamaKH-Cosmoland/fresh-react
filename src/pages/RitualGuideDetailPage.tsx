import { useMemo, useState } from "react";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const guide = useMemo(() => getRitualGuideBySlug(slug), [slug]);
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { t } = useTranslation();

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
        <Navbar sticky onMenuToggle={() => setSidebarOpen(true)} showSectionLinks={false} />
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="ritual-guide-detail-page__content ng-mobile-shell">
          <SectionTitle title="Guide not found" align="center" />
          <p>The ritual you are seeking has not yet been written.</p>
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
      <Navbar sticky onMenuToggle={() => setSidebarOpen(true)} showSectionLinks={false} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="ritual-guide-detail-page__content ng-mobile-shell">
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
                title="Layer these rituals"
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
                        {detail.priceLabel && (
                          <p className="shop-product-card__price">{detail.priceLabel}</p>
                        )}
                      </div>
                      <p className="shop-product-card__tagline">{detail.shortTagline}</p>
                        <div className="shop-product-card__actions">
                          <Button
                            variant="primary"
                            size="md"
                            onClick={() =>
                              addItem({
                                id: detail.productId,
                                name: detail.productName,
                                price: detail.priceNumber,
                                imageUrl: detail.heroImage,
                              })
                            }
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
                    onAddBundle={addBundleToCart}
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
