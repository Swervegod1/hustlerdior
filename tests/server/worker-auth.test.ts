import { test } from "node:test";
import assert from "node:assert/strict";
import { GET } from "../../src/app/api/internal/payment-worker/route";

test("the payment worker rejects missing configuration and unauthorized requests before database access", async () => {
  const previous = process.env.CRON_SECRET;
  try {
    delete process.env.CRON_SECRET;
    assert.equal(
      (
        await GET(
          new Request("https://hustlerdior.com/api/internal/payment-worker"),
        )
      ).status,
      503,
    );
    process.env.CRON_SECRET = "test-only-secret-not-for-production-000001";
    for (const authorization of [
      "",
      "Bearer wrong",
      `Bearer ${"x".repeat(process.env.CRON_SECRET.length)}`,
    ]) {
      const response = await GET(
        new Request("https://hustlerdior.com/api/internal/payment-worker", {
          headers: { authorization },
        }),
      );
      assert.equal(response.status, 401);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
});
