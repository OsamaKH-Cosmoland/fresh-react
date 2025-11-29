export function parsePrice(value: string | number | null | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value !== "string") return 0;
  const number = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  return Number.isNaN(number) ? 0 : number;
}

export function formatCurrency(amount: number, currency = "EGP", locale = "en-EG"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
}

export function formatPriceLabel(value: string | number, currency = "EGP", locale = "en-EG"): string {
  return formatCurrency(parsePrice(value), currency, locale);
}