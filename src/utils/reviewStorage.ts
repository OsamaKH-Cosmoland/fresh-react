import type { LocalReview, LocalReviewInput, ReviewTargetType } from "@/types/localReview";

const STORAGE_KEY = "naturagloss_reviews";

const canUseStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const safelyParse = (value: string | null): LocalReview[] | null => {
  if (value == null) return null;
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed as LocalReview[];
    }
  } catch (error) {
    console.warn("Failed to parse saved reviews", error);
  }
  return null;
};

const sortByDate = (reviews: LocalReview[]) =>
  [...reviews].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

function readStoredReviews(): LocalReview[] {
  if (!canUseStorage()) return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safelyParse(raw);
  if (!parsed) return [];
  return sortByDate(parsed);
}

function writeReviews(reviews: LocalReview[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));
  } catch (error) {
    console.warn("Unable to write reviews", error);
  }
}

export function listReviews(): LocalReview[] {
  return readStoredReviews();
}

export function listReviewsFor(targetId: string, type: ReviewTargetType): LocalReview[] {
  if (!targetId) return [];
  return listReviews().filter(
    (review) => review.type === type && review.targetId === targetId
  );
}

const createId = () =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function addReview(input: LocalReviewInput): LocalReview {
  const nextReview: LocalReview = {
    id: createId(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  const existing = readStoredReviews();
  const updated = [nextReview, ...existing];
  writeReviews(updated);
  return nextReview;
}

export function getReviewStats(targetId: string, type: ReviewTargetType) {
  const reviews = listReviewsFor(targetId, type);
  if (!reviews.length) return { average: null, count: 0 };
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return {
    average: sum / reviews.length,
    count: reviews.length,
  };
}

export const REVIEW_STORAGE_KEY = STORAGE_KEY;
