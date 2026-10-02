import type { Metadata } from "next";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { loadGuides } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

const title =
  "Streetwear Brand Guides: Tactical Luxury, Veteran-Owned, 90s Bootleg";
const description =
  "Streetwear brand guides from Hustler Dior: tactical luxury positioning, the veteran-owned story, 90s bootleg graphic tees, The Concrete Edit, and how to wash printed tees made to order through Printful.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: absoluteUrl("/guides") },
  openGraph: {
    title: `${title} | Hustler Dior`,
    description,
    url: absoluteUrl("/guides"),
  },
};

export default function GuidesIndex() {
  const guides = loadGuides();
  return (
    <ReadingPage
      title="THE GUIDES."
      name="Guides"
      path="/guides"
      intro={description}
    >
      {guides.map((guide) => (
        <section key={guide.slug} className="guide-index-item">
          <h2>{guide.h1}</h2>
          <p>{guide.description}</p>
          <Link href={`/guides/${guide.slug}`}>Read the guide ↗</Link>
        </section>
      ))}
      <p>
        Explore the{" "}
        <Link href="/collections/tees">tees</Link> or read{" "}
        <Link href="/about">About Hustler Dior</Link>.
      </p>
    </ReadingPage>
  );
}
