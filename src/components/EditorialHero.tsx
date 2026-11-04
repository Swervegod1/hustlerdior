import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";

export default function EditorialHero({ feature, secondary }: {
  feature?: Product;
  secondary?: Product;
}) {
  return (
    <section className="lookbook-hero" aria-labelledby="lookbook-heading">
      <div className="lookbook-art" aria-hidden="true">
        <span className="lookbook-orbit lookbook-orbit-one" />
        <span className="lookbook-orbit lookbook-orbit-two" />
        {feature?.image && <Image src={feature.image} alt="" fill priority
          sizes="100vw" className="lookbook-product-image" />}
        <span className="lookbook-art-mark">HD / 01</span>
      </div>
      <div className="lookbook-topline"><span>THE CONCRETE EDIT / 001</span><span>INDEPENDENT STREETWEAR</span></div>
      <div className="lookbook-copy">
        <p className="lookbook-kicker">AN INDEPENDENT POINT OF VIEW</p>
        <h1 id="lookbook-heading">BUILT TO<br /><em>STAND OUT.</em></h1>
        <p>Original graphics. Uncompromising expression. Pieces for the people making their own way.</p>
        <div className="lookbook-actions">
          <a href="#collection">EXPLORE THE COLLECTION <span aria-hidden="true">↗</span></a>
          <Link href="/world">THE WORLD OF HUSTLER DIOR ↗</Link>
        </div>
      </div>
      {secondary?.image && (
        <Link href={`/products/${secondary.slug}`} className="lookbook-detail" aria-label={`Explore ${secondary.name}`}>
          <Image src={secondary.image} alt={secondary.name} fill sizes="160px" />
          <span>IN THE ROTATION<br /><b>{money(secondary.priceCents, secondary.currency)}</b></span>
        </Link>
      )}
      <div className="lookbook-footer"><span>DESIGNED WITH INTENTION.</span><span>MADE TO ORDER / CURRENT COLLECTION</span><a href="#drops">EXPLORE RELEASES ↓</a></div>
    </section>
  );
}