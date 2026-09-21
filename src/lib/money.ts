export function formatMoney(amount: number, currency = "USD"): string {
  if (!Number.isFinite(amount)) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(amount);
}
