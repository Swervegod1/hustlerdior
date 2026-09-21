// Modeling helper, not live pricing. All amounts are USD cents, excluding tax.
// fixedCostsMinor includes COGS, supplier shipping, packing, AI and fixed fees.
export function minimumRevenueMinor({ fixedCostsMinor, feeRate, reserveRate, marginRate }) {
  if (!Number.isSafeInteger(fixedCostsMinor) || fixedCostsMinor < 0) throw new Error("Invalid fixed costs");
  for (const rate of [feeRate, reserveRate, marginRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate >= 1) throw new Error("Invalid rate");
  }
  const denominator = 1 - feeRate - reserveRate - marginRate;
  if (denominator <= 0) throw new Error("No feasible margin at these rates");
  let revenue = Math.ceil(fixedCostsMinor / denominator);
  if (!Number.isSafeInteger(revenue)) throw new Error("Modeled price exceeds safe integer range");
  while (revenue - fixedCostsMinor - Math.ceil(revenue * feeRate) - Math.ceil(revenue * reserveRate) < revenue * marginRate) revenue++;
  return revenue;
}

export function contributionMinor({ revenueMinor, fixedCostsMinor, feeRate, reserveRate }) {
  if (!Number.isSafeInteger(revenueMinor) || revenueMinor <= 0) throw new Error("Invalid revenue");
  minimumRevenueMinor({ fixedCostsMinor, feeRate, reserveRate, marginRate: 0 });
  return revenueMinor - fixedCostsMinor - Math.ceil(revenueMinor * feeRate) - Math.ceil(revenueMinor * reserveRate);
}
