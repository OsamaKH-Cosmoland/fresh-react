export type SupportedCurrency = "EGP" | "SEK" | "EUR";

export type CurrencyConfig = {
  code: SupportedCurrency;
  label: string;
  symbol: string;
  symbolPosition: "before" | "after";
  decimals: number;
  rateFromBase: number;
};

export const BASE_CURRENCY: SupportedCurrency = "EGP";

export const CURRENCIES: CurrencyConfig[] = [
  {
    code: "EGP",
    label: "EGP – Egyptian Pound",
    symbol: "E£",
    symbolPosition: "before",
    decimals: 2,
    rateFromBase: 1,
  },
  {
    code: "SEK",
    label: "SEK – Swedish Krona",
    symbol: "kr",
    symbolPosition: "after",
    decimals: 2,
    rateFromBase: 0.48, // Placeholder rate; update with current FX as needed.
  },
  {
    code: "EUR",
    label: "EUR – Euro",
    symbol: "€",
    symbolPosition: "before",
    decimals: 2,
    rateFromBase: 0.040, // Placeholder rate; update with current FX as needed.
  },
];
