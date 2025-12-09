import { CURRENCIES, BASE_CURRENCY, type CurrencyConfig, type SupportedCurrency } from "./currencyConfig";

const currencyMap = new Map<SupportedCurrency, CurrencyConfig>(
  CURRENCIES.map((entry) => [entry.code, entry])
);

export function getCurrencyConfig(code: SupportedCurrency): CurrencyConfig {
  const match = currencyMap.get(code);
  if (match) return match;
  return currencyMap.get(BASE_CURRENCY)!;
}

export function convertFromBase(baseAmount: number, target: SupportedCurrency): number {
  const config = getCurrencyConfig(target);
  return baseAmount * config.rateFromBase;
}

export function isSupportedCurrency(value: unknown): value is SupportedCurrency {
  return typeof value === "string" && currencyMap.has(value as SupportedCurrency);
}
