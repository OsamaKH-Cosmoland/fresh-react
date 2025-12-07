import React from "react";
import { Card } from "@/components/ui";
import type { CustomerReview } from "@/content/reviews";

export interface ReviewCardProps {
  review: CustomerReview;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="customer-review-card" data-animate="fade-up">
      <p className="review-card__quote">“{review.quote}”</p>
      <p className="review-card__meta">
        {review.author}
        {review.location ? ` · ${review.location}` : ""}
        <span className="review-card__rating" aria-label={`${review.rating} out of 5 stars`}>
          {"★".repeat(review.rating) + "☆".repeat(5 - review.rating)}
        </span>
      </p>
      {review.detail && <p className="review-card__detail">{review.detail}</p>}
    </Card>
  );
}
