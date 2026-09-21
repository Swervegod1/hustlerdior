/** All amounts are integer cents. These are planning assumptions, not tax or fee quotes. */
export interface MarginAssumptions {
  processingRate: number;
  processingFixedCents: number;
  returnsReserveRate: number;
  targetContributionRate: number;
}

export const planningAssumptions: MarginAssumptions = {
  processingRate: 0.029,
  processingFixedCents: 30,
  returnsReserveRate: 0.03,
  targetContributionRate: 0.35,
};

function validate(cents: number[], assumptions: MarginAssumptions) {
  if (cents.some((n) => !Number.isSafeInteger(n) || n < 0))
    throw new Error("Use non-negative, safe integer cents.");
  const rates = [
    assumptions.processingRate,
    assumptions.returnsReserveRate,
    assumptions.targetContributionRate,
  ];
  if (
    rates.some((n) => !Number.isFinite(n) || n < 0 || n >= 1) ||
    rates.reduce((a, b) => a + b, 0) >= 1 ||
    !Number.isSafeInteger(assumptions.processingFixedCents) ||
    assumptions.processingFixedCents < 0
  )
    throw new Error("Invalid margin assumptions.");
}

export function contribution(
  priceCents: number,
  fulfillmentTotalCents: number,
  shippingChargedCents: number,
  assumptions: MarginAssumptions = planningAssumptions,
) {
  validate(
    [priceCents, fulfillmentTotalCents, shippingChargedCents],
    assumptions,
  );
  const revenueCents = priceCents + shippingChargedCents;
  const processingCents =
    Math.ceil(revenueCents * assumptions.processingRate) +
    assumptions.processingFixedCents;
  const reserveCents = Math.ceil(priceCents * assumptions.returnsReserveRate);
  const contributionCents =
    revenueCents - fulfillmentTotalCents - processingCents - reserveCents;
  return {
    revenueCents,
    processingCents,
    reserveCents,
    contributionCents,
    // Margin denominator is total merchant revenue, including charged shipping; excludes customer sales tax.
    contributionRate: revenueCents ? contributionCents / revenueCents : 0,
  };
}

export function recommendPrice(
  fulfillmentTotalCents: number,
  shippingChargedCents: number,
  assumptions: MarginAssumptions = planningAssumptions,
) {
  validate([fulfillmentTotalCents, shippingChargedCents], assumptions);
  const {
    processingRate: f,
    returnsReserveRate: r,
    targetContributionRate: m,
  } = assumptions;
  const denominator = 1 - f - r - m;
  const floor = Math.max(
    0,
    Math.ceil(
      (fulfillmentTotalCents +
        assumptions.processingFixedCents -
        (1 - f - m) * shippingChargedCents) /
        denominator,
    ),
  );
  // Round UP to a .99 ending, then account for whole-cent fee/reserve rounding.
  let priceCents = Math.max(99, Math.ceil((floor + 1) / 100) * 100 - 1);
  while (
    contribution(
      priceCents,
      fulfillmentTotalCents,
      shippingChargedCents,
      assumptions,
    ).contributionRate < m
  )
    priceCents += 100;
  return {
    priceCents,
    ...contribution(
      priceCents,
      fulfillmentTotalCents,
      shippingChargedCents,
      assumptions,
    ),
  };
}
