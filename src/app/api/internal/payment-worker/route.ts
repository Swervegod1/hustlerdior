import { timingSafeEqual } from "node:crypto";
import { workPaymentJobs } from "@/lib/server/payment-worker";
import { privateHeaders } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Vercel Cron sends this server-only secret as a Bearer token. Never use a
// query-string secret: URLs commonly appear in access logs and analytics.
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 32)
    return Response.json(
      { error: "Worker unavailable." },
      { status: 503, headers: privateHeaders },
    );
  const expected = Buffer.from(`Bearer ${secret}`);
  const received = Buffer.from(request.headers.get("authorization") ?? "");
  if (
    received.length !== expected.length ||
    !timingSafeEqual(received, expected)
  )
    return Response.json(
      { error: "Unauthorized." },
      { status: 401, headers: privateHeaders },
    );
  try {
    // One bounded job per invocation; existing database leases deduplicate
    // concurrent invocations and preserve retries after a process timeout.
    await workPaymentJobs(1);
    return Response.json({ ok: true }, { headers: privateHeaders });
  } catch {
    return Response.json(
      { error: "Worker pass failed." },
      { status: 503, headers: privateHeaders },
    );
  }
}
