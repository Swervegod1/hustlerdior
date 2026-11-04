"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const approvedAt = process.env.NEXT_PUBLIC_APPROVED_DROP_AT ?? "";
const hasApprovedDate = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(approvedAt) && /(?:Z|[+-]\d{2}:\d{2})$/.test(approvedAt);
const target = hasApprovedDate ? Date.parse(approvedAt) : NaN;
function formatRemaining(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return [Math.floor(minutes / 1440), Math.floor((minutes % 1440) / 60), minutes % 60]
    .map(n => String(n).padStart(2, "0")).join(" : ");
}
export default function DropCalendar() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 60000);
    return () => clearInterval(timer);
  }, []);
  const upcoming = now !== null && Number.isFinite(target) && target > now;
  return (
    <section className="drop-calendar" id="drops" aria-labelledby="drops-heading">
      <div>
        <p className="eyebrow">THE RELEASE DESK / DROP CALENDAR</p>
        <h2 id="drops-heading">NOTHING<br />ORDINARY.</h2>
        <p>New releases are announced only after designs, pricing and available quantities are confirmed.</p>
      </div>
      <div className="drop-calendar-panel">
        <span className="eyebrow">NEXT RELEASE</span>
        {upcoming ? (
          <>
            <strong className="drop-timer" role="timer" aria-label="Days, hours, minutes until next release">
              {formatRemaining(target - now)}
            </strong>
            <span className="drop-timer-label">DAYS : HOURS : MINUTES</span>
            <time dateTime={approvedAt}>{new Date(target).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })}</time>
          </>
        ) : (
          <>
            <strong className="drop-tba">TO BE<br />ANNOUNCED.</strong>
            <span>No artificial countdown or unverified stock claims.</span>
          </>
        )}
        <div className="drop-calendar-links">
          <Link href="/releases">THE RELEASE CALENDAR ↗</Link>
          <Link href="/#collection">SHOP CURRENT PIECES ↗</Link>
        </div>
      </div>
    </section>
  );
}