import type { Metadata } from "next";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Hustler Dior is an independent streetwear brand built around self-expression, graphic pieces and the ambition to create something of your own.";
export const metadata: Metadata = {
  title: "About the Brand",
  description,
  alternates: { canonical: absoluteUrl("/about") },
  openGraph: {
    title: "About Hustler Dior",
    description,
    url: absoluteUrl("/about"),
  },
};

export default function About() {
  return (
    <ReadingPage
      title="BUILT FROM AMBITION."
      name="About Hustler Dior"
      path="/about"
      intro={description}
    >
      <h2>WHAT IS HUSTLER DIOR?</h2>
      <p>
        Hustler Dior is streetwear for people building their own story. The
        collection brings graphic tees, hoodies, layers and accessories into a
        wardrobe with a point of view.
      </p>
      <h2>THE CONCRETE EDIT.</h2>
      <p>
        Heavy typography. Dark tones. Unfiltered expression. The Concrete Edit
        is the visual language of this storefront: a meeting of everyday
        streetwear and an editorial attitude.
      </p>
      <p>
        Make the outfit your own. Start with a graphic tee, change the
        proportions with a cropped or oversized layer, and choose the color that
        belongs in your rotation.
      </p>
      <h2>HOW THE COLLECTION WORKS.</h2>
      <p>
        The current collection connects to our Printful store. Product pages
        show the color and size combinations in that catalog, with availability
        checked as you choose a piece.
      </p>
      <p>
        <Link href="/help">Ordering information</Link> explains the current
        checkout status. <Link href="/fit-guide">The fit guide</Link> helps you
        compare silhouettes before selecting a size.
      </p>
      <Link className="editorial-link" href="/collections/tees">
        EXPLORE TEES & TOPS ↗
      </Link>
    </ReadingPage>
  );
}
