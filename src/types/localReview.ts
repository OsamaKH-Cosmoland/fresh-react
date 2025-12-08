export type ReviewTargetType = "product" | "bundle";

export interface LocalReview {
  id: string;
  targetId: string;
  type: ReviewTargetType;
  rating: number;
  title?: string;
  body: string;
  photoUrl?: string;
  reviewerName?: string;
  createdAt: string;
}

export type LocalReviewInput = Omit<LocalReview, "id" | "createdAt">;
