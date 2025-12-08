const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EGP",
  minimumFractionDigits: 2,
});

export function formatCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "EGP 0.00";
  }
  return currencyFormatter.format(value);
}
