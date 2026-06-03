import {
  FREE_STANDARD_SHIPPING_THRESHOLD,
  calculateShippingMethods,
  isAlexandriaCity,
} from "@/checkout/shippingCalculator";

describe("calculateShippingMethods", () => {
  it("returns Alexandria pickup, standard, and express rates below the threshold", () => {
    const methods = calculateShippingMethods(300, "Alexandria");

    expect(methods.map((method) => method.id)).toEqual(["local", "standard", "express"]);
    expect(methods.find((method) => method.id === "local")?.cost).toBe(0);
    expect(methods.find((method) => method.id === "standard")?.cost).toBe(45);
    expect(methods.find((method) => method.id === "express")?.cost).toBe(65);
  });

  it("recognizes Arabic Alexandria names", () => {
    expect(isAlexandriaCity("الإسكندرية")).toBe(true);
    expect(isAlexandriaCity("اسكندرية")).toBe(true);
  });

  it("treats Alexandria neighborhood selections as inside Alexandria", () => {
    const methods = calculateShippingMethods(300, "Smouha, Alexandria");

    expect(methods.map((method) => method.id)).toEqual(["local", "standard", "express"]);
    expect(methods.find((method) => method.id === "standard")?.cost).toBe(45);
  });

  it("hides local pickup and uses national rates outside Alexandria", () => {
    const methods = calculateShippingMethods(300, "Cairo");

    expect(methods.map((method) => method.id)).toEqual(["standard", "express"]);
    expect(methods.find((method) => method.id === "standard")?.cost).toBe(80);
    expect(methods.find((method) => method.id === "express")?.cost).toBe(130);
  });

  it("makes only standard delivery free when the cart reaches the threshold", () => {
    const methods = calculateShippingMethods(FREE_STANDARD_SHIPPING_THRESHOLD, "Giza");

    expect(methods.find((method) => method.id === "standard")).toMatchObject({
      cost: 0,
      originalCost: 80,
      isFree: true,
    });
    expect(methods.find((method) => method.id === "express")?.cost).toBe(130);
  });
});
