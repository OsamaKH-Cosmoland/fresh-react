import {
  addReview,
  listReviews,
  listReviewsFor,
  REVIEW_STORAGE_KEY,
} from "@/utils/reviewStorage";
import type { LocalReviewInput } from "@/types/localReview";

describe("reviewStorage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns empty collections when storage is empty or malformed", () => {
    expect(listReviews()).toEqual([]);
    window.localStorage.setItem(REVIEW_STORAGE_KEY, "not-json");
    expect(listReviews()).toEqual([]);
  });

  it("adds reviews and filters by target", () => {
    const input: LocalReviewInput = {
      targetId: "product-1",
      type: "product",
      rating: 5,
      body: "Loved it",
    };
    const added = addReview(input);
    expect(added).toMatchObject(input);

    const all = listReviews();
    expect(all[0].id).toBe(added.id);

    const filtered = listReviewsFor("product-1", "product");
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe(added.id);
  });
});
