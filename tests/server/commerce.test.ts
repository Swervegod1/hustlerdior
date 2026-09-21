import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import Stripe from "stripe";
import sharp from "sharp";
import {
  sanitizePhoto,
  trustedGarmentUrl,
  tryOnConfigured,
} from "../../src/lib/server/try-on";
import { USAGE_SQL } from "../../src/lib/server/database";
import { CLAIM_JOB_SQL } from "../../src/lib/server/payment-worker";
import { readBytes } from "../../src/lib/server/http";

test("durable queue deduplicates events and fences stale workers; usage cap is atomic", async () => {
  const db = new PGlite();
  try {
    const sql = await readFile(
      new URL("../../database/001-commerce.sql", import.meta.url),
      "utf8",
    );
    await db.exec(sql);
    await db.exec(sql);
    const id = "01947832-4567-7abc-8def-123456789012";
    await db.query(
      "INSERT INTO hd_orders(id,owner_hash,snapshot) VALUES ($1,'owner','{}')",
      [id],
    );
    for (let i = 0; i < 2; i++)
      await db.query(
        "INSERT INTO hd_payment_jobs(event_id,order_id) VALUES ('evt_1',$1) ON CONFLICT(event_id) DO NOTHING",
        [id],
      );
    assert.equal(
      (await db.query("SELECT * FROM hd_payment_jobs")).rows.length,
      1,
    );
    const first = "01947832-4567-7abc-8def-123456789013",
      second = "01947832-4567-7abc-8def-123456789014";
    assert.equal((await db.query(CLAIM_JOB_SQL, [first])).rows.length, 1);
    assert.equal((await db.query(CLAIM_JOB_SQL, [second])).rows.length, 0);
    await db.query(
      "UPDATE hd_payment_jobs SET lease_until=now()-interval '1 minute'",
    );
    assert.equal((await db.query(CLAIM_JOB_SQL, [second])).rows.length, 1);
    assert.equal(
      (
        await db.query(
          "UPDATE hd_payment_jobs SET done=true WHERE event_id='evt_1' AND lease_token=$1 RETURNING event_id",
          [first],
        )
      ).rows.length,
      0,
    );
    for (let i = 0; i < 3; i++)
      assert.equal(
        (await db.query(USAGE_SQL, ["tryon:global", "2026-09-13", 3])).rows
          .length,
        1,
      );
    assert.equal(
      (await db.query(USAGE_SQL, ["tryon:global", "2026-09-13", 3])).rows
        .length,
      0,
    );
    assert.equal(
      (await db.query(USAGE_SQL, ["tryon:global", "2026-09-14", 3])).rows
        .length,
      1,
    );
    await assert.rejects(() =>
      db.query(
        "INSERT INTO hd_orders(id,owner_hash,snapshot,status) VALUES ($1,'owner','{}','made_up')",
        [second],
      ),
    );
  } finally {
    await db.close();
  }
});
test("photo ingestion re-encodes and strips metadata; disguised SVG and corrupt data fail", async () => {
  const fixture = await sharp({
    create: { width: 320, height: 480, channels: 3, background: "#556644" },
  })
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const clean = await sanitizePhoto(fixture, "image/jpeg");
  const meta = await sharp(clean).metadata();
  assert.equal(meta.format, "jpeg");
  assert.equal(meta.exif, undefined);
  assert.equal(meta.orientation, undefined);
  await assert.rejects(() =>
    sanitizePhoto(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"/>',
      ),
      "image/png",
    ),
  );
  await assert.rejects(() =>
    sanitizePhoto(Buffer.from("not a photo"), "image/jpeg"),
  );
  await assert.rejects(() => sanitizePhoto(fixture, "image/svg+xml"));
  await assert.rejects(() =>
    sanitizePhoto(Buffer.alloc(8 * 1024 * 1024 + 1), "image/jpeg"),
  );
});
test("product reference fetch cannot use arbitrary hosts, credentials or ports", () => {
  assert.equal(
    trustedGarmentUrl("https://files.cdn.printful.com/test.png").hostname,
    "files.cdn.printful.com",
  );
  for (const url of [
    "http://files.cdn.printful.com/test.png",
    "https://files.cdn.printful.com.evil.invalid/test.png",
    "https://secret@files.cdn.printful.com/test.png",
    "https://files.cdn.printful.com:9443/test.png",
    "https://127.0.0.1/test",
  ])
    assert.throws(() => trustedGarmentUrl(url));
});
test("multipart body cap applies while streaming, not just to Content-Length", async () => {
  const request = new Request("https://example.invalid", {
    method: "POST",
    body: "1234567890",
  });
  await assert.rejects(() => readBytes(request, 5));
  assert.equal(tryOnConfigured(), false);
});
test("Stripe signature verification rejects altered bodies and stale timestamps", () => {
  const stripe = new Stripe("sk_test_fixture_only");
  const secret = "whsec_fixture_only";
  const payload = JSON.stringify({
    id: "evt_fixture",
    object: "event",
    type: "checkout.session.completed",
  });
  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
  assert.equal(
    stripe.webhooks.constructEvent(payload, signature, secret).id,
    "evt_fixture",
  );
  assert.throws(() =>
    stripe.webhooks.constructEvent(payload + " ", signature, secret),
  );
  const stale = stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
    timestamp: Math.floor(Date.now() / 1000) - 1000,
  });
  assert.throws(() => stripe.webhooks.constructEvent(payload, stale, secret));
});
