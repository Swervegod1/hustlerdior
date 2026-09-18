import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { humanRequestSchema } from "../support";
import { HttpError } from "./http";
import { database, transaction, USAGE_SQL } from "./database";

const configuration = z.object({
  enabled: z.literal("true"),
  account: z.string().regex(/^AC[0-9a-fA-F]{32}$/),
  token: z.string().min(20),
  service: z.string().regex(/^MG[0-9a-fA-F]{32}$/),
  destination: z.string().regex(/^\+[1-9]\d{7,14}$/),
  dailyLimit: z.coerce.number().int().min(1).max(100),
  database: z.string().min(1),
  session: z.string().min(32),
});
function config() {
  return configuration.safeParse({
    enabled: process.env.SUPPORT_SMS_ENABLED,
    account: process.env.TWILIO_ACCOUNT_SID,
    token: process.env.TWILIO_AUTH_TOKEN,
    service: process.env.TWILIO_MESSAGING_SERVICE_SID,
    destination: process.env.SUPPORT_SMS_TO,
    dailyLimit: process.env.SUPPORT_SMS_DAILY_LIMIT,
    database: process.env.DATABASE_URL,
    session: process.env.APP_SESSION_SECRET,
  });
}
export function supportConfigured() {
  return config().success;
}
export const CLAIM_SUPPORT_SQL = `INSERT INTO hd_support_requests(id,owner_hash,payload_hash,status)
  VALUES ($1,$2,$3,'pending') ON CONFLICT(id) DO NOTHING RETURNING id`;
const queuedMessage =
  "Your request is queued for the team. They can reply to the email you provided.";

export async function requestHuman(value: unknown, owner: string) {
  const input = humanRequestSchema.parse(value);
  const parsed = config();
  if (!parsed.success)
    throw new HttpError(
      503,
      "Human alerts are not connected yet. Please email hustlerdior@gmail.com.",
    );
  const c = parsed.data;
  const payloadHash = createHash("sha256")
    .update(
      JSON.stringify({
        name: input.name,
        email: input.email,
        reason: input.reason,
      }),
    )
    .digest("hex");
  const fresh = await transaction(async (db) => {
    const claimed = await db.query(CLAIM_SUPPORT_SQL, [
      input.requestId,
      owner,
      payloadHash,
    ]);
    if (!claimed.rowCount) {
      const existing = await db.query(
        "SELECT owner_hash,payload_hash,status FROM hd_support_requests WHERE id=$1",
        [input.requestId],
      );
      const row = existing.rows[0];
      if (row?.owner_hash !== owner || row?.payload_hash !== payloadHash)
        throw new HttpError(409, "This request reference is already in use.");
      if (row.status === "submitted") return false;
      throw new HttpError(
        409,
        "This request has already been attempted. Please email the team if you have not heard back.",
      );
    }
    const day = new Date().toISOString().slice(0, 10);
    for (const [bucket, limit] of [
      ["support:global", c.dailyLimit],
      [`support:${owner}`, 2],
    ] as const) {
      if (!(await db.query(USAGE_SQL, [bucket, day, limit])).rowCount)
        throw new HttpError(
          429,
          "The support request limit has been reached. Please email hustlerdior@gmail.com.",
        );
    }
    return true;
  });
  if (!fresh) return { status: "queued", message: queuedMessage };
  try {
    const clean = (text: string) => text.replace(/[\r\n\t]+/g, " ");
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${c.account}/Messages.json`,
      {
        method: "POST",
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Basic ${Buffer.from(`${c.account}:${c.token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: c.destination,
          MessagingServiceSid: c.service,
          Body: `Hustler Dior: requested human help\n${clean(input.name) || "Shopper"} / ${clean(input.email)}\n${clean(input.reason)}\nRef ${input.requestId.slice(0, 8)}`,
        }),
      },
    );
    if (!response.ok) throw new Error("Notification rejected");
    const result = z
      .object({
        sid: z.string().regex(/^SM[0-9a-fA-F]{32}$/),
        status: z.enum(["accepted", "queued", "sending", "sent", "delivered"]),
      })
      .parse(await response.json());
    await database().query(
      "UPDATE hd_support_requests SET status='submitted',provider_id=$2,updated_at=now() WHERE id=$1",
      [input.requestId, result.sid],
    );
    return { status: "queued", message: queuedMessage };
  } catch {
    // A timeout may happen after the provider accepted a send. Never retry
    // automatically: retain the request ID and require manual reconciliation.
    await database()
      .query(
        "UPDATE hd_support_requests SET status='unconfirmed',updated_at=now() WHERE id=$1 AND status='pending'",
        [input.requestId],
      )
      .catch(() => {});
    throw new HttpError(
      502,
      "We could not confirm your alert. Please email hustlerdior@gmail.com instead.",
    );
  }
}
