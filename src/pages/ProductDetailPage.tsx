import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { ProductDetailLayout } from "@/components/product/ProductDetailLayout";
import {
  PRODUCT_DETAIL_MAP,
  getDefaultVariant,
  getLocalizedProductVariants,
  localizeProductDetail,
} from "@/content/productDetails";
import { recordView } from "@/hooks/useRecentlyViewed";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ritualBundles } from "@/content/bundles";
import { useBundleActions } from "@/cart/cartBundles";
import { useLiveAnnouncer } from "@/components/accessibility/LiveAnnouncer";
import { useReviews } from "@/hooks/useReviews";
import { useTranslation } from "@/localization/locale";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";
import { buildProductCartPayload } from "@/utils/productVariantUtils";
import { trackEvent } from "@/analytics/events";
import { usePageAnalytics } from "@/analytics/usePageAnalytics";
import { isTargetVerifiedForAnyOrder } from "@/utils/reviewVerification";
import { useSeo } from "@/seo/useSeo";
import { buildAppUrl } from "@/utils/navigation";

export interface ProductDetailPageProps {
  slug: string;
}

export default function ProductDetailPage({ slug }: ProductDetailPageProps) {
  usePageAnalytics("product");
  const rawDetail = PRODUCT_DETAIL_MAP[slug];
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const { announce } = useLiveAnnouncer();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const { t, locale } = useTranslation();
  const detail = rawDetail ? localizeProductDetail(rawDetail, locale) : undefined;

  const productId = rawDetail?.productId ?? "";
  const { reviews, averageRating, reviewsCount, isVerifiedAvailable, addReview } = useReviews(
    productId,
    "product"
  );

  const priceNumber = detail?.priceNumber ?? 0;

  useEffect(() => {
    if (!rawDetail) return;
    recordView(rawDetail.productId, "product");
  }, [rawDetail]);

  const variantPool = useMemo(
    () => getLocalizedProductVariants(productId, locale),
    [productId, locale]
  );
  const defaultVariantId = useMemo(() => getDefaultVariant(productId)?.variantId, [productId]);

  useEffect(() => {
    setSelectedVariantId(defaultVariantId);
  }, [defaultVariantId]);

  const selectedVariant =
    variantPool.find((variant) => variant.variantId === selectedVariantId) ?? variantPool[0];

  const productTitle = detail
    ? `${detail.productName}${detail.shortTagline ? ` · ${detail.shortTagline}` : ""}`
    : undefined;
  const productDescription = detail?.shortTagline ?? detail?.whatItsMadeFor;

  const productJsonLd = useMemo(() => {
    if (!detail) return undefined;
    const price = selectedVariant?.priceNumber ?? detail.priceNumber;
    const hasRating = averageRating !== null && reviewsCount > 0;
    const aggregateRating = hasRating
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(averageRating?.toFixed(1)),
          reviewCount: reviewsCount,
        }
      : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "Product",
      name: detail.productName,
      description: productDescription ?? detail.shortTagline,
      image: detail.heroImage,
      sku: selectedVariant?.variantId ?? detail.productId,
      brand: { "@type": "Brand", name: "NaturaGloss" },
      offers: {
        "@type": "Offer",
        priceCurrency: "EGP",
        price,
        availability: "https://schema.org/InStock",
        url: buildAppUrl(`/products/${detail.slug}`),
      },
      ...(aggregateRating ? { aggregateRating } : {}),
    };
  }, [detail, selectedVariant, averageRating, reviewsCount, productDescription]);

  const faqJsonLd = useMemo(() => {
    if (!detail?.faq?.length) return undefined;
    const entries = detail.faq
      .slice(0, 3)
      .map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      }))
      .filter((entry) => entry.name && entry.acceptedAnswer?.text);
    if (!entries.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: entries,
    };
  }, [detail?.faq]);

  const jsonLdEntries = useMemo(() => {
    if (!detail) return undefined;
    const entries: { id: string; data: unknown }[] = [];
    if (productJsonLd) {
      entries.push({ id: `product-jsonld-${detail.productId}`, data: productJsonLd });
    }
    if (faqJsonLd) {
      entries.push({ id: `product-faq-${detail.productId}`, data: faqJsonLd });
    }
    return entries.length ? entries : undefined;
  }, [detail, productJsonLd, faqJsonLd]);

  useSeo({
    route: "product",
    title: productTitle,
    description: productDescription,
    canonicalPath: detail ? `/products/${detail.slug}` : undefined,
    ogImageUrl: detail?.heroImage,
    jsonLd: jsonLdEntries,
  });

  useEffect(() => {
    if (!detail) return;
    trackEvent({
      type: "view_product",
      productId: detail.productId,
      variantId: selectedVariant?.variantId,
      source: "product_detail",
    });
  }, [detail?.productId, selectedVariant?.variantId]);

  const addToBag = useCallback(() => {
    if (!detail || priceNumber <= 0) return;
    addItem(buildProductCartPayload(detail, selectedVariantId));
    announce(
      t("accessibility.live.addedToBag", {
        item: detail.productName,
      })
    );
    const resolvedPrice =
      selectedVariant?.priceNumber ?? detail.priceNumber;
    trackEvent({
      type: "add_to_cart",
      itemType: "product",
      id: detail.productId,
      quantity: 1,
      price: resolvedPrice,
      variantId: selectedVariantId,
      source: "product_detail",
    });
  }, [addItem, announce, detail, priceNumber, selectedVariantId, selectedVariant, t]);

  const handleReviewSubmit = useCallback(
    (values: Parameters<typeof addReview>[0]) => {
      const nextReview = addReview(values);
      trackEvent({
        type: "submit_review",
        targetId: productId,
        rating: nextReview.rating,
        verified: isTargetVerifiedForAnyOrder(productId, "product"),
      });
      return nextReview;
    },
    [addReview, productId]
  );

  const goToCollection = useCallback(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    const collectionUrl = new URL(base, window.location.origin);
    collectionUrl.hash = "grid";
    window.location.href = collectionUrl.toString();
  }, []);

  if (!detail) {
    return (
      <main id="main-content" tabIndex={-1} className="ng-mobile-shell">
        <p>Product not found.</p>
      </main>
    );
  }

  const relatedBundles = useMemo(
    () =>
      ritualBundles.filter((bundle) =>
        bundle.products.some((entry) => entry.productId === detail?.productId)
      ),
    [detail]
  );

  return (
    <>
      <ProductDetailLayout
        {...detail}
        variants={detail.variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
        heroActions={
          <Button variant="secondary" size="md" onClick={goToCollection}>
            {t("productDetail.backToCollection")}
          </Button>
        }
        onAddToBag={addToBag}
      />
      <section className="product-review-section ng-mobile-shell" data-animate="fade-up">
        <SectionTitle
          title={t("reviews.sectionTitle")}
          subtitle={t("reviews.sectionSubtitle")}
          align="left"
        />
        <div className="product-review-section__grid">
              <div className="product-review-section__summary">
                <ReviewSummary
                  averageRating={averageRating}
                  reviewsCount={reviewsCount}
                  isVerifiedAvailable={isVerifiedAvailable}
                />
              </div>
              <div className="product-review-section__details">
                <ReviewList reviews={reviews} isVerified={isVerifiedAvailable} />
                <ReviewForm addReview={handleReviewSubmit} />
              </div>
            </div>
          </section>
      {relatedBundles.length > 0 && (
        <section className="product-detail-bundles ng-mobile-shell" data-animate="fade-up">
        <SectionTitle
          title={t("productDetail.related.title")}
          subtitle={t("productDetail.related.subtitle")}
          align="left"
        />
            <div className="bundle-grid ng-grid-mobile-2">
            {relatedBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                viewSource="product_detail"
                onAddBundle={(bundleItem, variantSelection) =>
                  addBundleToCart(bundleItem, variantSelection)
                }
              />
            ))}
            </div>
        </section>
      )}
    </>
  );
}
