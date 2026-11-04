import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Returns & Damaged Orders",
  description: "How to request support for a Hustler Dior order issue.",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/returns") },
};
export default function Returns() {
  return <ReadingPage title="ORDER SUPPORT." name="Returns and damaged items" path="/returns"
    intro="How to contact Hustler Dior about sizing, return requests and damaged or incorrect orders.">
    <h2>REPORT A PROBLEM</h2>
    <p>If an item arrives damaged, incorrect or with a print problem, <Link href="/contact">contact the store</Link> with your order reference, the issue and photos of the item or packaging when appropriate. Do not send payment details.</p>
    <h2>SIZE AND PREFERENCE CHANGES</h2>
    <p>These pieces are made to order. Before purchasing, compare the available size choices with the <Link href="/fit-guide">fit guide</Link>. Contact the store before returning any item; an unapproved return shipment may not be accepted.</p>
    <h2>POLICY APPROVAL PENDING</h2>
    <p>The final eligibility rules, time limits, return address, postage responsibility and refund processing terms are awaiting store-owner approval. This page makes no promise of free returns or a fixed refund window. Applicable consumer rights are unaffected. <Link href="/contact">Ask for written clarification before ordering</Link>.</p>
  </ReadingPage>;
}