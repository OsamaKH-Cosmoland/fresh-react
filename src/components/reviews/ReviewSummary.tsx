import { Card } from "@/components/ui";
import { useTranslation } from "@/localization/locale";

const buildStars = (rating: number) => {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
};

export interface ReviewSummaryProps {
  averageRating: number | null;
  reviewsCount: number;
  isVerifiedAvailable: boolean;
}

export function ReviewSummary({ averageRating, reviewsCount, isVerifiedAvailable }: ReviewSummaryProps) {
  const { t } = useTranslation();
  const reviewLabel = reviewsCount ? t("reviews.summary.reviewLabel") : t("reviews.summary.noReviews");
  const stars = averageRating != null ? buildStars(averageRating) : "☆☆☆☆☆";
  const averageDisplay = averageRating != null ? averageRating.toFixed(1) : t("reviews.summary.noRating");

  return (
    <Card className="review-summary-card">
      <div className="review-summary-card__score">
        <span className="review-summary-card__stars" aria-hidden="true">
          {stars}
        </span>
        <div>
          <p className="review-summary-card__average">{averageDisplay}</p>
          <p className="review-summary-card__meta">
            {reviewsCount ? `${reviewsCount} ${reviewLabel}` : reviewLabel}
          </p>
        </div>
      </div>
      {isVerifiedAvailable && (
        <p className="review-summary-card__verified">{t("reviews.summary.verifiedHint")}</p>
      )}
    </Card>
  );
}
