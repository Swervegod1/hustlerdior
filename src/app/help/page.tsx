import type { Metadata } from "next";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Answers about the Hustler Dior collection, Printful production, size availability, saved shopping bags and the current online checkout status.";
export const metadata: Metadata = {
  title: "Ordering Information & Answers",
  description,
  alternates: { canonical: absoluteUrl("/help") },
  openGraph: {
    title: "Hustler Dior Ordering Information",
    description,
    url: absoluteUrl("/help"),
  },
};

export default function Help() {
  return (
    <ReadingPage
      title="THE DETAILS MATTER."
      name="Ordering information"
      path="/help"
      intro={description}
    >
      <h2>IS ONLINE CHECKOUT OPEN?</h2>
      <p>
        Online checkout is being prepared. You can explore pieces, choose
        variants and save a bag on this device. Payment is not currently
        collected through this storefront.
      </p>
      <h2>HOW ARE THE PIECES PRODUCED?</h2>
      <p>
        The current collection is set up for made-to-order production through
        Printful. An available variant means the catalog currently lists that
        combination as available; it does not mean a finished garment is sitting
        in a Hustler Dior warehouse.
      </p>
      <h2>HOW DO I CHOOSE A SIZE AND COLOR?</h2>
      <p>
        Open a piece, choose a color, then select an available size. The
        displayed price follows that combination. Read the{" "}
        <Link href="/fit-guide">fit guide</Link> before deciding on a
        silhouette.
      </p>
      <h2>HOW ARE NEW PIECES ORDERED?</h2>
      <p>
        The Extended Edit opens with the newest Shopify creation dates first.
        The main collection follows Printful’s current store listing; that API
        does not provide creation dates, so its ordering does not establish a
        garment’s original release date.
      </p>
      <h2>WHAT HAPPENS TO MY BAG?</h2>
      <p>
        Your bag is saved in this browser on this device. Clearing browser
        storage removes it. It does not automatically transfer to another
        device, and adding a piece does not reserve inventory.
      </p>
      <h2>WHEN WILL SHIPPING AND RETURNS BE AVAILABLE?</h2>
      <p>
        Delivery quotes and the store’s shipping and returns policies will be
        published before online checkout opens. We are not promising a delivery
        date or a free-shipping threshold during this catalog preview.
      </p>
      <h2>CAN I FIND WOMEN’S AND MEN’S STREETWEAR HERE?</h2>
      <p>
        Yes. Browse the{" "}
        <Link href="/collections/womens-streetwear">women’s edit</Link> or the{" "}
        <Link href="/collections/mens-streetwear">men’s edit</Link>. Both
        include unisex pieces alongside the catalog’s gender-specific styles.
      </p>
    </ReadingPage>
  );
}
