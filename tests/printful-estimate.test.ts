import { test } from "node:test";
import assert from "node:assert/strict";
import { printfulEstimateSchema } from "../src/lib/printful-estimate";

const estimate = (shipping: unknown, total: unknown, currency = "USD") => ({
  result: { costs: { currency, shipping, total } },
});

test("Printful documented numeric estimate produces integer cents", () => {
  assert.deepEqual(printfulEstimateSchema.parse(estimate(5, 15)).result.costs, {
    currency: "USD",
    shipping: 500,
    total: 1500,
  });
});

test("decimal numbers and strings produce the same exact cents", () => {
  for (const [shipping, total] of [
    [4.69, 20.29],
    ["4.69", "20.29"],
    [4.69, "20.29"],
  ]) {
    assert.deepEqual(
      printfulEstimateSchema.parse(estimate(shipping, total)).result.costs,
      {
        currency: "USD",
        shipping: 469,
        total: 2029,
      },
    );
  }
  assert.equal(
    printfulEstimateSchema.parse(estimate(0, "0.00")).result.costs.total,
    0,
  );
});

test("invalid costs and unexpected currencies remain rejected", () => {
  for (const invalid of [
    null,
    undefined,
    true,
    "",
    " ",
    -1,
    "-1",
    NaN,
    Infinity,
    1.234,
    "1.234",
    100000.01,
  ]) {
    assert.equal(
      printfulEstimateSchema.safeParse(estimate(invalid, 15)).success,
      false,
    );
    assert.equal(
      printfulEstimateSchema.safeParse(estimate(5, invalid)).success,
      false,
    );
  }
  assert.equal(
    printfulEstimateSchema.safeParse(estimate(5, 15, "EUR")).success,
    false,
  );
});
