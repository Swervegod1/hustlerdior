import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CheckoutParseError, parseCheckoutItems, parseRecipient } from "../src/lib/checkout/parse.ts";
import { reachedCatalogEnd } from "../src/lib/printful/paging.ts";

describe("Printful catalog paging", () => {
  it("continues across full 100-item pages until total is reached", () => {
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 100, total: 286 }),
      false,
    );
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 200, total: 286 }),
      false,
    );
    assert.equal(
      reachedCatalogEnd({ pageLength: 86, nextOffset: 286, total: 286 }),
      true,
    );
  });

  it("does not stop at 100 or 300 when more pages exist", () => {
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 100, total: 450 }),
      false,
    );
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 300, total: 450 }),
      false,
    );
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 450, total: 450 }),
      true,
    );
  });

  it("stops on an empty page or the safety offset", () => {
    assert.equal(reachedCatalogEnd({ pageLength: 0, nextOffset: 0 }), true);
    assert.equal(
      reachedCatalogEnd({ pageLength: 100, nextOffset: 10_000, total: 99_999 }),
      true,
    );
  });
});

describe("checkout item parser", () => {
  it("accepts unique variant lines", () => {
    const items = parseCheckoutItems({
      items: [
        { productId: "11", variantId: "21", quantity: 2 },
        { productId: "12", variantId: "22", quantity: 1 },
      ],
    });
    assert.equal(items.length, 2);
    assert.equal(items[0]?.quantity, 2);
  });

  it("rejects duplicates, empty bags, and oversize quantities", () => {
    assert.throws(
      () => parseCheckoutItems({ items: [] }),
      CheckoutParseError,
    );
    assert.throws(
      () =>
        parseCheckoutItems({
          items: [
            { productId: "1", variantId: "9", quantity: 1 },
            { productId: "1", variantId: "9", quantity: 2 },
          ],
        }),
      CheckoutParseError,
    );
    assert.throws(
      () =>
        parseCheckoutItems({
          items: [{ productId: "1", variantId: "9", quantity: 99 }],
        }),
      CheckoutParseError,
    );
  });
});

describe("shipping recipient parser", () => {
  it("accepts a US address and rejects a bad ZIP", () => {
    const recipient = parseRecipient({
      recipient: {
        name: "Swerve God",
        email: "swerve@example.com",
        address1: "100 Concrete Ave",
        city: "Brooklyn",
        state_code: "ny",
        country_code: "US",
        zip: "11201",
      },
    });
    assert.equal(recipient?.state_code, "NY");
    assert.throws(
      () =>
        parseRecipient({
          recipient: {
            name: "Swerve God",
            email: "swerve@example.com",
            address1: "100 Concrete Ave",
            city: "Brooklyn",
            state_code: "NY",
            country_code: "US",
            zip: "nope",
          },
        }),
      CheckoutParseError,
    );
  });
});
