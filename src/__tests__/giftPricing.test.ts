import {
  calculateAddOnTotal,
  calculateGiftTotal,
  calculateProductTotal,
} from "@/utils/giftPricing";
import { PRODUCT_DETAIL_CONFIGS, getVariantById } from "@/content/productDetails";

const bodyBalm = PRODUCT_DETAIL_CONFIGS.find((entry) => entry.productId === "body-balm");
const calmGlow = PRODUCT_DETAIL_CONFIGS.find(
  (entry) => entry.productId === "calm-glow-body-soap"
);

describe("gift pricing helpers", () => {
  it("sums products with variant pricing", () => {
    if (!bodyBalm || !calmGlow) {
      throw new Error("Required product details missing");
    }
    const selectedVariants = { "body-balm": "body-balm-silk" };
    const total = calculateProductTotal([bodyBalm, calmGlow], selectedVariants);
    const expectedVariant = getVariantById("body-balm", "body-balm-silk");
    const expectedBodyPrice = expectedVariant?.priceNumber ?? bodyBalm.priceNumber;
    const expectedTotal = expectedBodyPrice + calmGlow.priceNumber;
    expect(total).toBeCloseTo(expectedTotal, 2);
  });

  it("adds addon totals and gift totals correctly", () => {
    const addOnTotal = calculateAddOnTotal(["silk-ribbon", "note-card"]);
    expect(addOnTotal).toBe(80);
    const giftTotal = calculateGiftTotal(160, 428.98, addOnTotal);
    expect(giftTotal).toBeCloseTo(668.98, 2);
  });
});
