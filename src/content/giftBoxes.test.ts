import {
  giftAddOns,
  giftBoxStyles,
  GIFT_BOX_MAX_PRODUCTS,
  GIFT_BOX_MIN_PRODUCTS,
} from "@/content/giftBoxes";

describe("gift box content", () => {
  it("exposes styles with required metadata", () => {
    expect(giftBoxStyles).toHaveLength(3);
    giftBoxStyles.forEach((style) => {
      expect(style.id).toBeTruthy();
      expect(style.name).toBeTruthy();
      expect(style.price).toBeGreaterThan(0);
    });
  });

  it("provides add-ons with descriptive labels and costs", () => {
    giftAddOns.forEach((addOn) => {
      expect(addOn.id).toBeTruthy();
      expect(addOn.label).toBeTruthy();
      expect(addOn.price).toBeGreaterThan(0);
    });
  });

  it("enforces min/max product counts", () => {
    expect(GIFT_BOX_MIN_PRODUCTS).toBeLessThanOrEqual(GIFT_BOX_MAX_PRODUCTS);
    expect(GIFT_BOX_MIN_PRODUCTS).toBeGreaterThanOrEqual(1);
  });
});
