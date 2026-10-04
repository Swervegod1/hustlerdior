import type { Metadata } from "next";
import Link from "next/link";

const title = "Page not found | Hustler Dior";
const description =
  "This Hustler Dior page is not available. Browse the collection or the streetwear guides.";

export const metadata: Metadata = {
  title: { absolute: title },
  description,
  // Next injects one noindex meta on a 404. A layout robots tag would be a second one.
  robots: null,
  openGraph: { title, description },
  twitter: { card: "summary", title, description },
};

export default function NotFound() {
  return (
    <main id="main" className="status-page">
      <p className="eyebrow">404 / OFF THE GRID</p>
      <h1>
        THIS PIECE
        <br />
        MOVED ON.
      </h1>
      <Link href="/#collection" className="primary-button">
        BACK TO THE COLLECTION ↗
      </Link>
    </main>
  );
}
