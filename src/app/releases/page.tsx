import Link from "next/link";
import type { Metadata } from "next";
import DropCalendar from "@/components/DropCalendar";
export const metadata: Metadata = {
  title: "Releases & Drop Calendar",
  description: "Follow upcoming Hustler Dior original streetwear releases. Dates appear only after they are approved.",
};
export default function ReleasesPage() {
  return (
    <main id="main" className="releases-page">
      <DropCalendar />
      <section className="reading-panel">
        <h1>THE RELEASES DESK.</h1>
        <p>Release dates, quantities and exclusive offers will appear here when verified and approved. No reservation or payment is required to browse.</p>
        <Link href="/#collection">Shop the current collection ↗</Link>
      </section>
    </main>
  );
}