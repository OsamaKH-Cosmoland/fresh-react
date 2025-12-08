import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { ProductDetailLayout } from "@/components/product/ProductDetailLayout";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { recordView } from "@/hooks/useRecentlyViewed";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ritualBundles } from "@/content/bundles";
import { useBundleActions } from "@/cart/cartBundles";
import { useReviews } from "@/hooks/useReviews";
import { useTranslation } from "@/localization/locale";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { ReviewList } from "@/components/reviews/ReviewList";
import { ReviewSummary } from "@/components/reviews/ReviewSummary";

export interface ProductDetailPageProps {
  slug: string;
}

export default function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const detail = PRODUCT_DETAIL_MAP[slug];
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined);
  const { t } = useTranslation();

  const productId = detail?.productId ?? "";
  const { reviews, averageRating, reviewsCount, isVerifiedAvailable, addReview } = useReviews(
    productId,
    "product"
  );

  const priceNumber = detail?.priceNumber ?? 0;

  useEffect(() => {
    if (!detail) return;
    recordView(detail.productId, "product");
  }, [detail]);

  const variantPool = detail?.variants ?? [];
  const defaultVariantId = useMemo(() => {
    if (!detail?.variants || detail.variants.length === 0) return undefined;
    const preferred = detail.variants.find((variant) => variant.variantId === detail.defaultVariantId);
    return preferred?.variantId ?? detail.variants[0].variantId;
  }, [detail?.variants, detail?.defaultVariantId]);

  useEffect(() => {
    setSelectedVariantId(defaultVariantId);
  }, [defaultVariantId]);

  const selectedVariant =
    variantPool.find((variant) => variant.variantId === selectedVariantId) ?? variantPool[0];

  const addToBag = useCallback(() => {
    if (!detail || priceNumber <= 0) return;
    const variantPrice = selectedVariant?.priceNumber ?? detail.priceNumber;
    addItem({
      productId: detail.productId,
      id: selectedVariant?.variantId ?? detail.productId,
      name: detail.productName,
      price: variantPrice,
      imageUrl: detail.heroImage,
      variantId: selectedVariant?.variantId,
      variantLabel: selectedVariant?.label,
      variantAttributes: selectedVariant?.attributes,
    });
  }, [addItem, detail, priceNumber, selectedVariant]);

  const goToCollection = useCallback(() => {
    const base = import.meta.env.BASE_URL ?? "/";
    const collectionUrl = new URL(base, window.location.origin);
    collectionUrl.hash = "grid";
    window.location.href = collectionUrl.toString();
  }, []);

  if (!detail) {
    return <p>Product not found.</p>;
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
            Back to collection
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
            <ReviewForm addReview={addReview} />
          </div>
        </div>
      </section>
      {relatedBundles.length > 0 && (
        <section className="product-detail-bundles ng-mobile-shell" data-animate="fade-up">
          <SectionTitle
            title="Complete your ritual"
            subtitle="These curated bundles pair naturally with this beauty."
            align="left"
          />
          <div className="bundle-grid ng-grid-mobile-2">
            {relatedBundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                onAddBundle={addBundleToCart}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
