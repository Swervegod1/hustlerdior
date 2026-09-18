import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { humanRequestSchema } from "../../src/lib/support";
import { CLAIM_SUPPORT_SQL, supportConfigured, requestHuman } from "../../src/lib/server/support";
import { POST } from "../../src/app/api/support/human/route";

const request = { requestId: "01947832-4567-7abc-8def-123456789099", explicitHumanRequest: true, name: "A shopper", email: "shopper@example.com", reason: "Help with a hoodie size" };
test("human handoff requires explicit consent and rejects arbitrary destinations", () => {
  assert.equal(humanRequestSchema.safeParse(request).success, true);
  for (const changed of [{ ...request, explicitHumanRequest: false }, { ...request, to: "+15555555555" }, { ...request, email: "broken" }, { ...request, reason: "x".repeat(181) }]) {
    assert.equal(humanRequestSchema.safeParse(changed).success, false);
  }
});
test("unconfigured human alerts fail closed before a database write or provider call", async () => {
  const before = process.env.SUPPORT_SMS_ENABLED;
  delete process.env.SUPPORT_SMS_ENABLED;
  try {
    assert.equal(supportConfigured(), false);
    await assert.rejects(() => requestHuman(request, "test-owner"), { status: 503 });
    const origin = new URL(process.env.SITE_URL || "http://localhost:3000").origin;
    const wrongOrigin = await POST(new Request(`${origin}/api/support/human`, { method: "POST", headers: { origin: "https://attacker.example" }, body: "{}" }));
    assert.equal(wrongOrigin.status, 403);
    const disabled = await POST(new Request(`${origin}/api/support/human`, { method: "POST", headers: { origin, "Content-Type": "application/json" }, body: JSON.stringify(request) }));
    assert.equal(disabled.status, 503);
    assert.match((await disabled.json()).error, /email/);
  } finally { if (before === undefined) delete process.env.SUPPORT_SMS_ENABLED; else process.env.SUPPORT_SMS_ENABLED = before; }
});
test("support references cannot be claimed twice or overwritten by another owner", async () => {
  const db = new PGlite();
  try {
    const sql = await readFile(new URL("../../database/002-support.sql", import.meta.url), "utf8");
    await db.exec(sql);
    await db.exec(sql);
    assert.equal((await db.query(CLAIM_SUPPORT_SQL, [request.requestId, "owner-a", "hash-a"])).rows.length, 1);
    assert.equal((await db.query(CLAIM_SUPPORT_SQL, [request.requestId, "owner-b", "hash-b"])).rows.length, 0);
    const result = await db.query<{ owner_hash: string; payload_hash: string; status: string }>("SELECT owner_hash,payload_hash,status FROM hd_support_requests WHERE id=$1", [request.requestId]);
    assert.deepEqual(result.rows[0], { owner_hash: "owner-a", payload_hash: "hash-a", status: "pending" });
    await assert.rejects(() => db.query("UPDATE hd_support_requests SET status='delivered' WHERE id=$1", [request.requestId]));
  } finally { await db.close(); }
});
