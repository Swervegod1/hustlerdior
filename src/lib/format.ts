export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
}
export function shortName(name: string) {
  return name.replace(/Unisex /i, "").replace(/Men[’']s /i, "");
}
