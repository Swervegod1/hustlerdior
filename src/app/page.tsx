import Image from "next/image";
import Link from "next/link";
import Hero from "@/components/Hero";
import Catalog from "@/components/Catalog";
import { Arrow } from "@/components/Icons";
import { initialCatalog } from "@/lib/server/catalog";
import { connection } from "next/server";
import type { Metadata } from "next";
import CollectionLinks from "@/components/CollectionLinks";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl } from "@/lib/seo";
import StudioArtifact from "@/components/StudioArtifact";
import { BRAND_LINKS } from "@/lib/brand";

export const metadata: Metadata = {
  alternates: { canonical: absoluteUrl("/") },
};

export default async function Home() {
  await connection();
  const catalog = await initialCatalog();
  const feature =
    catalog?.products.find((p) => /skullfx/i.test(p.name)) ??
    catalog?.products[0];
  const editorial =
    catalog?.products.find((p) =>
      /oversized heavyweight sweatshirt/i.test(p.name),
    ) ?? catalog?.products[1];
  return (
    <main id="main" tabIndex={-1}>
      <Hero
        feature={feature}
        secondary={catalog?.products.find((p) => p.category === "Accessories")}
      />
      <div className="manifesto-strip">
        <span>MAKE YOUR OWN RULES</span>
        <span aria-hidden="true">✳</span>
        <span>WEAR YOUR OWN STORY</span>
        <span aria-hidden="true">✳</span>
        <span>HUSTLE IS AN ART FORM</span>
        <span aria-hidden="true">✳</span>
      </div>
      <Catalog initial={catalog} />
      <Link href="/curated" className="extended-entry">
        <span>BEYOND THE EVERYDAY.</span>
        <strong>THE EXTENDED EDIT</strong>
        <span>
          EXPLORE THE CATALOG PREVIEW <Arrow />
        </span>
      </Link>
      <CollectionLinks products={catalog?.products ?? []} />
      <section
        className="editorial"
        id="editorial"
        aria-labelledby="editorial-heading"
      >
        <div className="editorial-copy">
          <p className="eyebrow">THE MANIFESTO / 001</p>
          <h2 id="editorial-heading">
            MADE TO
            <br />
            MAKE
            <br />
            <span>NOISE.</span>
          </h2>
          <p>
            Hustler Dior is for the creators, the risk-takers, and the ones
            building something of their own. Streetwear with a point of view.
            Ambition you can wear.
          </p>
          <a className="editorial-link" href="#collection">
            FIND YOUR EXPRESSION <Arrow />
          </a>
          <span className="editorial-signature">
            SWERVE GOD / CREATIVE DIRECTION
          </span>
          <Link href="/world" className="editorial-link">
            EXPLORE OUR CREATIVE WORLD <Arrow />
          </Link>
        </div>
        <div className="culture-board">
          <div className="editorial-image">
            {editorial?.image && (
              <Image
                src={editorial.image}
                alt={editorial.name}
                fill
                sizes="(max-width: 760px) 44vw, (max-width: 1100px) 40vw, 26vw"
              />
            )}
            <span className="editorial-stamp">
              WEAR YOUR
              <br />
              OWN STORY. ↗
            </span>
            <span className="editorial-image-note">
              HUSTLER DIOR / ORIGINAL COLLECTION
            </span>
          </div>
          <StudioArtifact />
        </div>
      </section>
      <div className="brand-principles">
        <div>
          <span>01</span>
          <p>
            ORIGINAL
            <br />
            <strong>BY DESIGN.</strong>
          </p>
        </div>
        <div>
          <span>02</span>
          <p>
            MADE
            <br />
            <strong>TO ORDER.</strong>
          </p>
        </div>
        <div>
          <span>03</span>
          <p>
            WEAR IT
            <br />
            <strong>YOUR WAY.</strong>
          </p>
        </div>
      </div>
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
