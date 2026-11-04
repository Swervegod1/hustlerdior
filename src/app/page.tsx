import Image from "next/image";
import Catalog from "@/components/Catalog";
import { initialCatalog } from "@/lib/server/catalog";
import { connection } from "next/server";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import { BRAND_LINKS } from "@/lib/brand";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string }>;
}) {
  await connection();
  const catalog = await initialCatalog();
  const category =
    (await searchParams).collection === "all" ? "All pieces" : "Tees";
  return (
    <main id="main" tabIndex={-1} className="chrome-storefront">
      <section className="chrome-banner" aria-label="Hustler Dior">
        <h1 className="sr-only">Hustler Dior — Independent Streetwear</h1>
        <Image
          src="/brand/chrome-lockup.webp"
          alt="Hustler Dior crowned HD crest"
          width={2172}
          height={724}
          sizes="100vw"
          priority
        />
      </section>
      <Catalog key={category} initial={catalog} initialCategory={category} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              "@id": absoluteUrl("/#brand"),
              name: "Hustler Dior",
              url: absoluteUrl("/"),
              logo: absoluteUrl("/icon.svg"),
              description: "Independent streetwear with a point of view.",
              sameAs: [BRAND_LINKS.archive],
            },
            {
              "@type": "WebSite",
              "@id": absoluteUrl("/#website"),
              name: "Hustler Dior",
              url: absoluteUrl("/"),
              publisher: { "@id": absoluteUrl("/#brand") },
            },
          ],
        }}
      />
    </main>
  );
}
