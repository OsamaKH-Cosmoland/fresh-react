import { useCallback, useEffect, useMemo } from "react";
import { Button, SectionTitle } from "@/components/ui";
import { useCart } from "@/cart/cartStore";
import { ProductDetailLayout } from "@/components/product/ProductDetailLayout";
import { PRODUCT_DETAIL_MAP } from "@/content/productDetails";
import { recordView } from "@/hooks/useRecentlyViewed";
import { BundleCard } from "@/components/bundles/BundleCard";
import { ritualBundles } from "@/content/bundles";
import { useBundleActions } from "@/cart/cartBundles";
import { customerReviews, type CustomerReview } from "@/content/reviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";

export interface ProductDetailPageProps {
  slug: string;
}

export default function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const detail = PRODUCT_DETAIL_MAP[slug];
  const { addItem } = useCart();
  const { addBundleToCart } = useBundleActions();

  const priceNumber = detail?.priceNumber ?? 0;

  useEffect(() => {
    if (!detail) return;
    recordView(detail.productId, "product");
  }, [detail]);

  const addToBag = useCallback(() => {
    if (!detail || priceNumber <= 0) return;
    addItem({
      id: detail.productId,
      name: detail.productName,
      price: detail.priceNumber,
      imageUrl: detail.heroImage,
    });
  }, [addItem, detail, priceNumber]);

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

  const productReviews = useMemo<CustomerReview[]>(
    () =>
      customerReviews
        .filter((review) => review.productId === detail?.productId)
        .slice(0, 3),
    [detail]
  );

  return (
    <>
      <ProductDetailLayout
        {...detail}
        heroActions={
          <Button variant="secondary" size="md" onClick={goToCollection}>
            Back to collection
          </Button>
        }
        onAddToBag={addToBag}
      />
      {productReviews.length > 0 && (
        <section className="product-detail-reviews" data-animate="fade-up">
          <SectionTitle
            title="What people are saying"
            subtitle="Gentle love letters from customers on these rituals."
          />
          <div className="review-grid">
            {productReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </section>
      )}
      {relatedBundles.length > 0 && (
        <section className="product-detail-bundles" data-animate="fade-up">
          <SectionTitle
            title="Complete your ritual"
            subtitle="These curated bundles pair naturally with this beauty."
            align="left"
          />
          <div className="bundle-grid">
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
