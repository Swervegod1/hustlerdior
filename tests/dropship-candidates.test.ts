import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  stageDropshipCandidates,
  contributionScenario,
} from "../src/lib/dropship-candidates";
import { stageWholesaleFeed } from "../src/lib/suppliers";
import { stageWholesaleCandidates } from "../src/lib/supplier-candidates";

const rows = JSON.parse(
  readFileSync(
    new URL("./fixtures/dropship-candidates.json", import.meta.url),
    "utf8",
  ),
);

test("research cannot supply stock, an approved retail price, or sale activation", () => {
  for (const mutation of [
    { saleEnabled: true },
    { quantityAvailable: 20 },
    { retailPriceCents: 4999 },
    { status: "published" },
  ]) {
    assert.throws(() => stageDropshipCandidates([{ ...rows[0], ...mutation }]));
  }
  assert.equal(stageDropshipCandidates(rows).length, 22);
});

test("source identity, duplicates and image integrity metadata are checked", () => {
  assert.throws(() => stageDropshipCandidates([rows[0], rows[0]]));
  assert.throws(() =>
    stageDropshipCandidates([{ ...rows[0], supplierProductId: "99" }]),
  );
  assert.throws(() =>
    stageDropshipCandidates([
      { ...rows[0], images: [{ ...rows[0].images[0], sha256: null }] },
    ]),
  );
  assert.throws(() =>
    stageDropshipCandidates([
      {
        ...rows[0],
        images: [{ ...rows[0].images[0], localFile: "../secrets.webp" }],
      },
    ]),
  );
});

test("price floor includes shipping, duty and loss reserve and rounds upward", () => {
  const scenario = {
    costCents: 1982,
    shippingCents: 599,
    dutyAllowanceCents: 0,
    fixedFeeCents: 30,
    feeRate: 0.03,
    returnLossReserveRate: 0.08,
    targetContributionRate: 0.35,
  };
  const result = contributionScenario(scenario);
  assert.equal(result.floorCents, 4836);
  assert.equal(result.testPriceCents, 4899);
  assert.ok(result.contributionCents / result.testPriceCents >= 0.35);
  assert.ok(
    contributionScenario({ ...scenario, shippingCents: 1299 }).floorCents >
      result.floorCents,
  );
  assert.throws(() => contributionScenario({ ...scenario, costCents: -1 }));
  assert.throws(() =>
    contributionScenario({ ...scenario, targetContributionRate: 0.9 }),
  );
});

test("existing S&S research stays valid; new suppliers accept account feeds as drafts", () => {
  const previous = JSON.parse(
    readFileSync(
      new URL("./fixtures/wholesale-candidates.json", import.meta.url),
      "utf8",
    ),
  );
  assert.equal(stageWholesaleCandidates(previous).length, 10);
  const now = new Date();
  for (const supplier of ["trendsi", "cj-dropshipping", "zendrop"]) {
    const staged = stageWholesaleFeed(
      [
        {
          supplier,
          supplierSku: "fixture-001",
          name: "Test garment",
          brand: "Test",
          audience: "Kids",
          category: "Tees",
          size: "4Y",
          color: "Black",
          quantityAvailable: 1,
          costCents: 1000,
          shippingCostCents: 500,
          currency: "USD",
          imageUrl: "https://example.com/test.jpg",
          supplierProductUrl: "https://example.com/test",
          feedUpdatedAt: now.toISOString(),
          authenticityEvidence: "Test fixture",
          imageUsageAuthorized: false,
          resaleAuthorized: false,
        },
      ],
      now,
    );
    assert.equal(staged[0].status, "draft");
    assert.equal(staged[0].reviewIssues.length, 2);
  }
});
