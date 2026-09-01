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

const wholeCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

// For headline figures only — "₹18,180" reads faster than "₹18,180.00".
// Tables and detail rows keep formatCurrency and its two decimals.
export function formatCurrencyWhole(amount) {
  return wholeCurrencyFormatter.format(amount);
}

// Signed amounts always carry their sign, never colour alone.
export function formatSigned(amount, type) {
  return `${type === "EXPENSE" ? "-" : "+"}${formatCurrency(amount)}`;
}
