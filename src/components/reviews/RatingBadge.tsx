import { useTranslation } from "@/localization/locale";

const buildStars = (rating: number) => {
  const clamped = Math.max(0, Math.min(5, Math.round(rating)));
  return "★".repeat(clamped) + "☆".repeat(5 - clamped);
};

export interface RatingBadgeProps {
  average: number | null;
  count: number;
  className?: string;
}

export function RatingBadge({ average, count, className = "" }: RatingBadgeProps) {
  const { t } = useTranslation();
  if (!count) return null;
  const displayRating = average != null ? average.toFixed(1) : t("reviews.summary.noRating");
  const ariaLabel =
    average != null
      ? t("reviews.summary.ratingAriaLabel", {
          rating: displayRating,
          count,
          reviewLabel: t("reviews.summary.reviewLabel"),
        })
      : t("reviews.summary.noRating");
  return (
    <div
      className={["rating-badge", className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
    >
      <span className="rating-badge__stars" aria-hidden="true">
        {buildStars(average ?? 0)}
      </span>
      <span className="rating-badge__text">
        {displayRating} · {count} {t("reviews.summary.reviewLabel")}
      </span>
    </div>
  );
}
