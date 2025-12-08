import { useMemo, useState } from "react";
import { Card } from "@/components/ui";
import { useLocale, useTranslation, type AppTranslationKey } from "@/localization/locale";
import type { LocalReview } from "@/types/localReview";

const RATING_FILTERS: { value: number; labelKey: AppTranslationKey }[] = [
  { value: 0, labelKey: "reviews.list.filterOptions.all" },
  { value: 5, labelKey: "reviews.list.filterOptions.five" },
  { value: 4, labelKey: "reviews.list.filterOptions.fourPlus" },
  { value: 3, labelKey: "reviews.list.filterOptions.threePlus" },
];

const buildStars = (rating: number) => {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
};

export interface ReviewListProps {
  reviews: LocalReview[];
  isVerified: boolean;
}

export function ReviewList({ reviews, isVerified }: ReviewListProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filteredReviews = useMemo(() => {
    const list = reviews.filter((review) => review.rating >= minRating);
    if (verifiedOnly && !isVerified) {
      return [];
    }
    return verifiedOnly ? list : list;
  }, [reviews, minRating, verifiedOnly, isVerified]);

  const formattedReviews = useMemo(
    () =>
      [...filteredReviews].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [filteredReviews]
  );

  const formatDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <section className="review-list">
      <div className="review-list__controls">
        <label className="review-list__control">
          {t("reviews.list.filterLabel")}
          <select
            value={minRating}
            onChange={(event) => setMinRating(Number(event.target.value))}
          >
            {RATING_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {t(filter.labelKey)}
              </option>
            ))}
          </select>
        </label>
        <label className="review-list__control review-list__control--toggle">
          <input
            type="checkbox"
            checked={verifiedOnly}
            disabled={!isVerified}
            onChange={() => setVerifiedOnly((prev) => !prev)}
          />
          {t("reviews.list.verifiedOnly")}
        </label>
      </div>

      {formattedReviews.length === 0 ? (
        <p className="review-list__empty">{t("reviews.list.empty")}</p>
      ) : (
        <div className="review-list__grid">
          {formattedReviews.map((review) => (
            <Card key={review.id} className="review-card">
              <header>
                <div>
                  <p className="review-card__stars" aria-hidden="true">
                    {buildStars(review.rating)}
                  </p>
                  {review.title && <h3>{review.title}</h3>}
                </div>
                <p className="review-card__meta">
                  {review.reviewerName || t("reviews.list.anonymous")}
                  <span>{formatDate(review.createdAt)}</span>
                </p>
              </header>
              <p>{review.body}</p>
              {review.photoUrl && (
                <img
                  src={review.photoUrl}
                  alt={review.title || t("reviews.list.photoAlt")}
                  className="review-card__photo"
                />
              )}
              {isVerified && (
                <span className="review-card__verified">
                  {t("reviews.list.verifiedBadge")}
                </span>
              )}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
