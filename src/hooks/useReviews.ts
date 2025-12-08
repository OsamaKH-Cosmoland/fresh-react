import { useCallback, useEffect, useMemo, useState } from "react";
import { isTargetVerifiedForAnyOrder } from "@/utils/reviewVerification";
import { addReview as addReviewStorage, listReviewsFor } from "@/utils/reviewStorage";
import type { LocalReview, LocalReviewInput, ReviewTargetType } from "@/types/localReview";

export interface UseReviewsResult {
  reviews: LocalReview[];
  reviewsCount: number;
  averageRating: number | null;
  isVerifiedAvailable: boolean;
  addReview: (input: ReviewSubmissionInput) => LocalReview;
}

export type ReviewSubmissionInput = Omit<LocalReviewInput, "targetId" | "type">;

const ORDER_STORAGE_KEY = "naturagloss_orders";

export function useReviews(targetId: string, type: ReviewTargetType): UseReviewsResult {
  const [reviews, setReviews] = useState<LocalReview[]>(() =>
    targetId ? listReviewsFor(targetId, type) : []
  );
  const [ordersSeed, setOrdersSeed] = useState(Date.now());

  useEffect(() => {
    if (!targetId) {
      setReviews([]);
      return;
    }
    setReviews(listReviewsFor(targetId, type));
  }, [targetId, type]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === ORDER_STORAGE_KEY) {
        setOrdersSeed(Date.now());
      }
    };
    if (typeof window === "undefined") return;
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const addReview = useCallback(
    (input: ReviewSubmissionInput) => {
      if (!targetId) {
        throw new Error("Missing review target");
      }
      const next = addReviewStorage({
        targetId,
        type,
        ...input,
      });
      setReviews((prev) => [next, ...prev]);
      return next;
    },
    [targetId, type]
  );

  const averageRating = useMemo(() => {
    if (!reviews.length) return null;
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return total / reviews.length;
  }, [reviews]);

  const isVerifiedAvailable = useMemo(
    () => Boolean(targetId && isTargetVerifiedForAnyOrder(targetId, type)),
    [ordersSeed, targetId, type]
  );

  return {
    reviews,
    reviewsCount: reviews.length,
    averageRating,
    isVerifiedAvailable,
    addReview,
  };
}
