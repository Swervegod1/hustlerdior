import Image from "next/image";
import Link from "next/link";
import { collections, collectionProducts } from "@/lib/collections";
import type { Product } from "@/lib/types";
import { Arrow } from "./Icons";

export default function CollectionLinks({
  products = [],
}: {
  products?: Product[];
}) {
  const used = new Set<number>();
  return (
    <section
      className="collection-directory remix-directory"
      aria-labelledby="browse-heading"
    >
      <div className="directory-heading">
        <div>
          <p className="eyebrow">THE EVERYDAY, REWORKED.</p>
          <h2 id="browse-heading">FIND YOUR ROTATION.</h2>
        </div>
        <p>BY FIT. BY FEEL. BY YOU.</p>
      </div>
      <div className="collection-links">
        {collections.map((c, i) => {
          const matches = collectionProducts(c, products).filter(
            (p) => p.image,
          );
          const product = matches.find((p) => !used.has(p.id)) ?? matches[0];
          if (product) used.add(product.id);
          return (
            <Link key={c.slug} href={`/collections/${c.slug}`}>
              <div className="collection-tile-image">
                <span className="tile-number" aria-hidden="true">
                  0{i + 1}
                </span>
                {product?.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 700px) 46vw, 23vw"
                  />
                ) : (
                  <span className="tile-monogram" aria-hidden="true">
                    HD
                  </span>
                )}
              </div>
              <div className="collection-tile-label">
                <strong>{c.name}</strong>
                <Arrow />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
