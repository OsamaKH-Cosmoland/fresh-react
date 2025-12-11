import {
  evaluatePromoForCart,
  bestApplicablePromo,
  type CartItemLike,
  type CartStateLike,
} from "./discountEngine";
import { PROMO_CODES, type PromoCodeDefinition } from "./promoCodes";

const buildCart = (items: CartItemLike[]): CartStateLike => ({
  items,
  subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
});

const shippingCost = 50;

describe("bestApplicablePromo", () => {
  it("returns null for empty or unknown codes", () => {
    const cart = buildCart([
      { id: "line-1", price: 120, quantity: 1, productId: "body-balm" },
    ]);
    expect(bestApplicablePromo("   ", cart, shippingCost)).toBeNull();
    expect(bestApplicablePromo("unknown", cart, shippingCost)).toBeNull();
  });

  it("normalizes casing before lookup", () => {
    const cart = buildCart([
      { id: "hair-line", price: 260, quantity: 2, productId: "hair-growth-oil" },
    ]);
    const result = bestApplicablePromo("welcome10", cart, shippingCost);
    expect(result?.code).toBe("WELCOME10");
  });
});

describe("evaluatePromoForCart", () => {
  const welcome = PROMO_CODES.find((p) => p.code === "WELCOME10")!;
  const hairCollection = PROMO_CODES.find((p) => p.code === "HAIRRITUAL15")!;
  const freeShip = PROMO_CODES.find((p) => p.code === "FREESHIP")!;
  const glowBundle = PROMO_CODES.find((p) => p.code === "GLOWDUO20")!;

  it("skips discounts when cart is empty or has non-positive lines", () => {
    const emptyCart = buildCart([]);
    expect(evaluatePromoForCart(welcome, emptyCart, shippingCost)).toBeNull();

    const cartWithZeroQuantity = buildCart([
      { id: "zero-qty", price: 150, quantity: 0, productId: "body-balm" },
    ]);
    expect(evaluatePromoForCart(welcome, cartWithZeroQuantity, shippingCost)).toBeNull();

    const noMinFreeShip: PromoCodeDefinition = {
      code: "FREESHIP-ALL",
      label: "Free delivery regardless of subtotal",
      target: { type: "cart_total" },
      benefit: { type: "free_shipping" },
      isActive: true,
    };
    const freeShippingOnlyZeroPrice = buildCart([
      { id: "zero-price", price: 0, quantity: 2, productId: "hair-growth-oil" },
    ]);
    const appliedFreeShip = evaluatePromoForCart(noMinFreeShip, freeShippingOnlyZeroPrice, shippingCost);
    expect(appliedFreeShip).toMatchObject({
      code: "FREESHIP-ALL",
      freeShipping: true,
      affectedItemIds: [],
      discountAmount: 0,
    });
  });

  it("applies a percentage discount across the whole cart when eligible", () => {
    const cart = buildCart([
      { id: "body-line", price: 250, quantity: 1, productId: "body-balm" },
      { id: "hair-line", price: 250, quantity: 1, productId: "hair-growth-oil" },
    ]);
    const result = evaluatePromoForCart(welcome, cart, shippingCost);
    expect(result).not.toBeNull();
    expect(result?.discountAmount).toBe(50);
    expect(result?.freeShipping).toBe(false);
    expect(result?.affectedItemIds).toEqual(["body-line", "hair-line"]);
  });

  it("caps fixed-amount discounts to the applicable total", () => {
    const flatOff: PromoCodeDefinition = {
      code: "FLAT100",
      label: "Flat 100 off",
      target: { type: "cart_total" },
      benefit: { type: "fixed_amount", value: 100 },
      isActive: true,
    };
    const cart = buildCart([{ id: "small", price: 50, quantity: 1, productId: "hand-balm" }]);
    const result = evaluatePromoForCart(flatOff, cart, shippingCost);
    expect(result?.discountAmount).toBe(50);
  });

  it("respects minimum order value thresholds", () => {
    const belowThresholdCart = buildCart([
      { id: "line-1", price: 150, quantity: 2, productId: "body-balm" },
    ]);
    expect(evaluatePromoForCart(welcome, belowThresholdCart, shippingCost)).toBeNull();

    const aboveThresholdCart = buildCart([
      { id: "line-2", price: 300, quantity: 2, productId: "body-balm" },
    ]);
    expect(evaluatePromoForCart(welcome, aboveThresholdCart, shippingCost)?.discountAmount).toBe(60);
  });

  it("only applies to matching products", () => {
    const productPromo: PromoCodeDefinition = {
      code: "HAIROIL25",
      label: "25% off hero oil",
      target: { type: "product", productId: "hair-growth-oil" },
      benefit: { type: "percent", value: 25 },
      isActive: true,
    };
    const cart = buildCart([
      { id: "hair-item", price: 200, quantity: 1, productId: "hair-growth-oil" },
      { id: "body-item", price: 100, quantity: 1, productId: "body-balm" },
    ]);
    const result = evaluatePromoForCart(productPromo, cart, shippingCost);
    expect(result?.discountAmount).toBe(50);
    expect(result?.affectedItemIds).toEqual(["hair-item"]);
  });

  it("matches collection-focused discounts while ignoring ineligible lines", () => {
    const cart = buildCart([
      { id: "hair-bundle", price: 389.99, quantity: 1, bundleId: "hair-strength-ritual" },
      { id: "hair-oil", price: 150, quantity: 1, productId: "hair-growth-oil" },
      { id: "body-line", price: 200, quantity: 1, productId: "body-balm" },
    ]);
    const result = evaluatePromoForCart(hairCollection, cart, shippingCost);
    expect(result?.discountAmount).toBeCloseTo(81, 2);
    expect(result?.affectedItemIds).toEqual(["hair-bundle", "hair-oil"]);
  });

  it("ignores collection promos when focus metadata is missing", () => {
    const cart = buildCart([{ id: "mystery", price: 180, quantity: 1, productId: "unknown-product" }]);
    expect(evaluatePromoForCart(hairCollection, cart, shippingCost)).toBeNull();
  });

  it("prevents stacking on bundles when promo disallows it", () => {
    const bundleOnlyCart = buildCart([
      { id: "glow-bundle-line", price: 600, quantity: 1, bundleId: "glow-hydrate-duo" },
    ]);
    expect(evaluatePromoForCart(welcome, bundleOnlyCart, shippingCost)).toBeNull();

    const allowedStackCart = buildCart([
      { id: "eligible-glow", price: 399.99, quantity: 1, bundleId: "glow-hydrate-duo" },
    ]);
    const result = evaluatePromoForCart(glowBundle, allowedStackCart, shippingCost);
    expect(result?.discountAmount).toBe(80);
    expect(result?.affectedItemIds).toEqual(["eligible-glow"]);
  });

  it("applies free shipping when subtotal threshold is met", () => {
    const cart = buildCart([
      { id: "line-1", price: 260, quantity: 1, productId: "hair-growth-oil" },
      { id: "line-2", price: 300, quantity: 1, productId: "body-balm" },
    ]);
    const applied = evaluatePromoForCart(freeShip, cart, shippingCost);
    expect(applied).toMatchObject({
      code: "FREESHIP",
      freeShipping: true,
      discountAmount: 0,
    });
    expect(applied?.affectedItemIds).toEqual(["line-1", "line-2"]);

    const belowThreshold = buildCart([{ id: "line-3", price: 200, quantity: 1, productId: "body-balm" }]);
    expect(evaluatePromoForCart(freeShip, belowThreshold, shippingCost)).toBeNull();
  });

  it("rejects invalid or zero-value configurations", () => {
    const zeroPercent: PromoCodeDefinition = {
      code: "NOP",
      label: "No savings",
      target: { type: "cart_total" },
      benefit: { type: "percent", value: 0 },
      isActive: true,
    };
    const cart = buildCart([{ id: "line-1", price: 120, quantity: 1, productId: "body-balm" }]);
    expect(evaluatePromoForCart(zeroPercent, cart, shippingCost)).toBeNull();

    const invalidTarget = {
      code: "BROKEN",
      label: "Broken config",
      target: { type: "unknown" },
      benefit: { type: "percent", value: 50 },
      isActive: true,
    } as unknown as PromoCodeDefinition;
    expect(evaluatePromoForCart(invalidTarget, cart, shippingCost)).toBeNull();
  });
});
