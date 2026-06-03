export const FREE_STANDARD_SHIPPING_THRESHOLD = 500;

export type ShippingMethodId = "local" | "standard" | "express";

export interface CalculatedShippingMethod {
  id: ShippingMethodId;
  label: string;
  description: string;
  eta: string;
  cost: number;
  originalCost: number;
  isFree: boolean;
}

const ALEXANDRIA_CITY_NAMES = new Set([
  "alexandria",
  "al alexandria",
  "el alexandria",
  "الإسكندرية",
  "الاسكندرية",
  "اسكندرية",
  "إسكندرية",
]);

const normalizeCity = (city: string) =>
  city
    .trim()
    .toLocaleLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\s+/g, " ");

export const isAlexandriaCity = (city: string) =>
  ALEXANDRIA_CITY_NAMES.has(normalizeCity(city)) ||
  normalizeCity(city).endsWith(", alexandria") ||
  normalizeCity(city).endsWith(" alexandria");

export const calculateShippingMethods = (
  cartTotal: number,
  city: string
): CalculatedShippingMethod[] => {
  const qualifiesForFreeStandard = cartTotal >= FREE_STANDARD_SHIPPING_THRESHOLD;
  const insideAlexandria = isAlexandriaCity(city);
  const standardBaseCost = insideAlexandria ? 45 : 80;

  const methods: CalculatedShippingMethod[] = [];

  if (insideAlexandria) {
    methods.push({
      id: "local",
      label: "Local Pickup",
      description: "Collect your order from Natura Gloss.",
      eta: "1-2 days",
      cost: 0,
      originalCost: 0,
      isFree: true,
    });
  }

  methods.push(
    {
      id: "standard",
      label: "Standard Delivery",
      description: insideAlexandria
        ? "Reliable Alexandria delivery."
        : "Reliable national delivery.",
      eta: "5-7 days",
      cost: qualifiesForFreeStandard ? 0 : standardBaseCost,
      originalCost: standardBaseCost,
      isFree: qualifiesForFreeStandard,
    },
    {
      id: "express",
      label: "Express Delivery",
      description: insideAlexandria
        ? "Priority Alexandria delivery."
        : "Priority national delivery.",
      eta: "2-3 days",
      cost: insideAlexandria ? 65 : 130,
      originalCost: insideAlexandria ? 65 : 130,
      isFree: false,
    }
  );

  return methods;
};
