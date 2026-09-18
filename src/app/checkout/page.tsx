import type { Metadata } from "next";
import { connection } from "next/server";
import CheckoutForm from "@/components/CheckoutForm";
import { checkoutConfigured } from "@/lib/server/stripe";
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};
export default async function Checkout() {
  await connection();
  return (
    <main id="main" className="reading-page checkout-page">
      <header className="collection-intro">
        <p className="eyebrow">HUSTLER DIOR / CHECKOUT</p>
        <h1>MAKE IT YOURS.</h1>
      </header>
      <CheckoutForm enabled={checkoutConfigured()} />
    </main>
  );
}
