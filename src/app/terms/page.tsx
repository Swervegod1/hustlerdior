import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Ordering Terms — Pending Final Approval",
  description: "Current ordering information for Hustler Dior; complete terms pending owner approval.",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/terms") },
};
export default function Terms() {
  return <ReadingPage title="BEFORE YOU ORDER." name="Ordering terms" path="/terms"
    intro="Important ordering information. This is not yet the store's final owner-approved sale agreement.">
    <h2>PRODUCT INFORMATION</h2>
    <p>Products, size choices, and availability are shown on their individual product pages. Availability is rechecked when a piece is added to the bag and again at checkout. Adding items does not reserve them.</p>
    <h2>ORDER TOTALS AND PAYMENT</h2>
    <p>When payment is enabled, the displayed checkout quote includes the selected items and shipping calculation for the submitted address. Stripe provides hosted payment. Any applicable tax and the final total are displayed before completing payment.</p>
    <h2>PRODUCTION AND SUPPORT</h2>
    <p>Core catalog items are made to order using Printful. Production drafts may require a separate review before production begins. Contact <Link href="/contact">support</Link> promptly about order issues.</p>
    <h2>FINAL TERMS ARE PENDING</h2>
    <p>Owner-approved shipping, returns, cancellation, refund and legal terms are required before this content can be treated as the final store agreement. Review <Link href="/shipping">shipping information</Link> and <Link href="/returns">return guidance</Link> and request clarification prior to purchase.</p>
  </ReadingPage>;
}