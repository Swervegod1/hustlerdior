import type { Metadata } from "next";
import Link from "next/link";
import ReadingPage from "@/components/ReadingPage";
import { loadGuides } from "@/lib/guides";
import { absoluteUrl } from "@/lib/seo";

const description =
  "Brand, collection, and care guides from Hustler Dior: the Concrete Edit, tactical luxury positioning, veteran-owned ownership, 90s bootleg graphic tees, and how to wash printed tees.";

export const metadata: Metadata = {
  title: "Guides",
  description,
  alternates: { canonical: absoluteUrl("/guides") },
  openGraph: {
    title: "Hustler Dior Guides",
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
