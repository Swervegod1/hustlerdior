import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import Link from "next/link";
import { absoluteUrl } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Shipping & Production Information",
  description: "How Hustler Dior estimates shipping for made-to-order products.",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/shipping") },
};
export default function Shipping() {
  return <ReadingPage title="SHIPPING DETAILS." name="Shipping information" path="/shipping"
    intro="Current technical ordering information. Final customer policy terms require store-owner approval.">
    <h2>MADE TO ORDER</h2>
    <p>The core collection uses Printful made-to-order production. An available product option does not mean a finished garment is ready to dispatch.</p>
    <h2>DELIVERY QUOTES</h2>
    <p>The current checkout supports United States delivery addresses and provides a fresh delivery quote for the selected items and address before payment. Shipping and applicable tax appear during checkout; changes to the address or bag require a new quote.</p>
    <h2>ESTIMATED TIMING</h2>
    <p>Production and carrier transit time vary by garment and destination. No guaranteed dispatch or delivery deadline or automatic free-shipping threshold is represented on this page.</p>
    <h2>POLICY APPROVAL PENDING</h2>
    <p>The final shipping policy, including processing windows, carrier options and delivery-problem procedures, has not yet been approved. <Link href="/contact">Contact support before ordering</Link> if these terms affect your purchase.</p>
  </ReadingPage>;
}