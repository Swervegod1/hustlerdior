import Link from "next/link";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { Arrow } from "@/components/Icons";
import { absoluteUrl, breadcrumbData } from "@/lib/seo";
import { BRAND_LINKS, brandAnswers } from "@/lib/brand";

const description =
  "Explore the world of Hustler Dior: independent streetwear, creative direction by Swerve God, Crown & Concrete, and the brand’s original creative archive.";
export const metadata: Metadata = {
  title: "The World of Hustler Dior",
  description,
  alternates: { canonical: absoluteUrl("/world") },
  openGraph: {
    title: "MORE THAN A WARDROBE. | Hustler Dior",
    description,
    url: absoluteUrl("/world"),
  },
};

export default function World() {
  return (
    <main id="main" className="brand-world" tabIndex={-1}>
      <header className="world-heading">
        <p className="eyebrow">HUSTLER DIOR / THE CREATIVE WORLD</p>
        <h1>
          MORE THAN
          <br />A <span>WARDROBE.</span>
        </h1>
        <div className="world-intro">
          <p>
            A graphic on a tee. A sound that stays with you. An idea made real.
            This is the world behind the clothes.
          </p>
          <span>
            CREATIVE DIRECTION
            <br />
            <strong>SWERVE GOD ↗</strong>
          </span>
        </div>
      </header>
      <section className="world-grid" aria-label="Explore the creative world">
        <Link href="/#collection" className="world-tile world-flagship">
          <span className="eyebrow">01 / THE FLAGSHIP</span>
          <strong>
            WEAR
            <br />
            YOUR STORY.
          </strong>
          <p>
            The current Hustler Dior collection. Graphic tees, layers and pieces
            with a point of view.
          </p>
          <span className="world-cta">
            EXPLORE THE COLLECTION <Arrow />
          </span>
        </Link>
        <a
          href={BRAND_LINKS.crown}
          className="world-tile world-crown"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="eyebrow">02 / RELATED COLLECTION</span>
          <strong>
            CROWN &<br />
            CONCRETE.
          </strong>
          <p>
            Discover graphic pieces and Swerve God designs in the related Crown
            & Concrete collection on Wix.
          </p>
          <span className="world-cta">
            VISIT CROWN & CONCRETE <Arrow />
          </span>
        </a>
        <a
          href={BRAND_LINKS.archive}
          className="world-tile world-archive"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span className="eyebrow">03 / THE ORIGINAL ARCHIVE</span>
          <strong>
            STYLE.
            <br />
            SOUND. CULTURE.
          </strong>
          <p>
            The original Hustler Dior Wix site connects the brand with music,
            media and its creative roots.
          </p>
          <span className="world-cta">
            EXPLORE THE ARCHIVE <Arrow />
          </span>
        </a>
      </section>
      <section
        className="world-answers"
        aria-labelledby="world-answers-heading"
      >
        <div>
          <p className="eyebrow">THE CONNECTING THREAD</p>
          <h2 id="world-answers-heading">
            ONE WORLD.
            <br />
            YOUR EXPRESSION.
          </h2>
        </div>
        <div>
          {brandAnswers.map((item) => (
            <details key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
          <Link href="/about" className="editorial-link">
            MEET THE BRAND <Arrow />
          </Link>
        </div>
      </section>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "CollectionPage",
              "@id": absoluteUrl("/world#page"),
              url: absoluteUrl("/world"),
              name: "The World of Hustler Dior",
              description,
              isPartOf: { "@id": absoluteUrl("/#website") },
              about: { "@id": absoluteUrl("/#brand") },
              relatedLink: [BRAND_LINKS.crown, BRAND_LINKS.archive],
            },
            {
              "@type": "FAQPage",
              "@id": absoluteUrl("/world#answers"),
              mainEntity: brandAnswers.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ],
        }}
      />
      <JsonLd
        data={breadcrumbData([
          { name: "Home", path: "/" },
          { name: "The creative world", path: "/world" },
        ])}
      />
    </main>
  );
}
