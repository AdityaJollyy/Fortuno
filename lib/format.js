const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

// For chart axes, where "₹1,43,767.49" would not fit. Gives "₹1.4L".
export function formatCurrencyCompact(amount) {
  return compactCurrencyFormatter.format(amount);
}
