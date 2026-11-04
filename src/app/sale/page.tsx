import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Sale & Verified Offers",
  description: "Verified Hustler Dior promotions and sale styles.",
  robots: { index: false, follow: true },
};
export default function SalePage() {
  return (
    <main id="main" className="sale-pending">
      <p className="eyebrow">HUSTLER DIOR / VERIFIED OFFERS</p>
      <h1>NO ACTIVE SALE ANNOUNCED.</h1>
      <p>Discounts appear only when a genuine reference price, approved offer and eligible stock are confirmed. No automatic promo or membership charge is active here.</p>
      <Link className="primary-button" href="/#collection">SHOP CURRENT PIECES ↗</Link>
    </main>
  );
}