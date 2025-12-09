import { BASE_CURRENCY, type SupportedCurrency } from "@/currency/currencyConfig";
import { convertFromBase, getCurrencyConfig } from "@/currency/currencyUtils";

type FormatOptions = {
  withCode?: boolean;
};

export function formatCurrency(
  baseAmount: number,
  currency: SupportedCurrency = BASE_CURRENCY,
  opts?: FormatOptions
) {
  const config = getCurrencyConfig(currency);
  const converted = convertFromBase(baseAmount, currency);
  const normalized = Number.isFinite(converted) ? converted : 0;
  const formattedNumber = normalized.toFixed(config.decimals);
  const value =
    config.symbolPosition === "before"
      ? `${config.symbol} ${formattedNumber}`
      : `${formattedNumber} ${config.symbol}`;
  return opts?.withCode ? `${value} ${currency}` : value;
}
