import type { Metadata } from "next";
import ReadingPage from "@/components/ReadingPage";
import { BRAND_LINKS } from "@/lib/brand";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Contact & Order Support",
  description: "Contact the Hustler Dior team about orders, sizing or product issues.",
  alternates: { canonical: absoluteUrl("/contact") },
};
export default function Contact() {
  return <ReadingPage title="LET'S TALK." name="Contact the store" path="/contact"
    intro="Questions before or after an order? Reach the store directly.">
    <h2>CONTACT THE TEAM</h2>
    <p>Email <a href={`mailto:${BRAND_LINKS.email}`}>{BRAND_LINKS.email}</a> with your question.</p>
    <p>For an existing order, include the order reference and a brief description. Never email payment card details, passwords or private access credentials.</p>
    <h2>PRODUCT AND FIT QUESTIONS</h2>
    <p>Please review the product options and the <a href="/fit-guide">fit guide</a> first. We cannot promise a garment measurement unless the specific product chart confirms it.</p>
    <h2>ORDER CHANGES, DELIVERY AND RETURNS</h2>
    <p>If an order needs attention, contact the team as soon as possible. Confirmation of a requested change depends on the actual order status. See <a href="/shipping">shipping information</a> and <a href="/returns">return guidance</a>.</p>
  </ReadingPage>;
}