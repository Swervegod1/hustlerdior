import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { notFound, permanentRedirect } from "next/navigation";
import {
  collections,
  collectionProducts,
  COLLECTION_PAGE_SIZE,
} from "@/lib/collections";
import { productIndex, productsForPage } from "@/lib/server/catalog";
import { absoluteUrl, breadcrumbData, listingProductData } from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import CollectionGrid from "@/components/CollectionGrid";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string | string[] }>;
};

async function resolve(props: Props) {
  await connection();
  const [{ slug }, query] = await Promise.all([
    props.params,
    props.searchParams,
  ]);
  const collection = collections.find((c) => c.slug === slug);
  if (
    !collection ||
    (query.page !== undefined &&
      (typeof query.page !== "string" || !/^[1-9]\d{0,4}$/.test(query.page)))
  )
    notFound();
  const page = Number(query.page ?? "1");
  const path = `/collections/${slug}`;
  const index = collectionProducts(collection, await productIndex());
  const pageCount = Math.max(1, Math.ceil(index.length / COLLECTION_PAGE_SIZE));
  if (page > pageCount) notFound();
  return {
    collection,
    page,
    path,
    index,
    pageCount,
    canonical: path + (page > 1 ? `?page=${page}` : ""),
  };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { collection, page, canonical } = await resolve(props);
  const title = collection.title + (page > 1 ? ` — Page ${page}` : "");
  return {
    title,
    description: collection.description,
    alternates: { canonical: absoluteUrl(canonical) },
    openGraph: {
      title,
      description: collection.description,
      url: absoluteUrl(canonical),
      type: "website",
    },
  };
}

export default async function CollectionPage(props: Props) {
  const { collection, page, path, index, pageCount, canonical } =
    await resolve(props);
  if ((await props.searchParams).page === "1") permanentRedirect(path);
  const offset = (page - 1) * COLLECTION_PAGE_SIZE;
  const products = await productsForPage(
    index.slice(offset, offset + COLLECTION_PAGE_SIZE).map((p) => p.id),
  );
  return (
    <main id="main" className="collection-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{collection.name}</span>
      </nav>
      <header className="collection-intro">
        <p className="eyebrow">THE HUSTLER DIOR EDIT</p>
        <h1>{collection.name}</h1>
        <p>
          {page === 1
            ? collection.intro
            : `More from ${collection.name.toLowerCase()}. Page ${page} of ${pageCount}.`}
        </p>
        <span className="eyebrow">
          {index.length} PIECES / PAGE {page} OF {pageCount}
        </span>
      </header>
      <nav className="collection-tabs" aria-label="Browse collections">
        {collections.map((c) => (
          <Link
            key={c.slug}
            href={`/collections/${c.slug}`}
            aria-current={c.slug === collection.slug ? "page" : undefined}
          >
            {c.name}
          </Link>
        ))}
      </nav>
      <CollectionGrid products={products} offset={offset} />
      {!products.length && (
        <p className="empty-results">
          This edit is being updated. Explore another collection above.
        </p>
      )}
      {pageCount > 1 && (
        <nav className="pagination" aria-label="Collection pages">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
            <Link
              key={n}
              aria-current={n === page ? "page" : undefined}
              aria-label={`Page ${n}`}
              href={path + (n === 1 ? "" : `?page=${n}`)}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
      {page === 1 && (
        <section className="reading-panel">
          <p className="eyebrow">MAKE IT YOURS</p>
          <h2>START WITH THE SILHOUETTE.</h2>
          <p>{collection.note}</p>
          <Link href="/fit-guide">Read the fit guide ↗</Link>
          <h3>How do I see the options for a piece?</h3>
          <p>
            Open a product to see its colors, sizes and current price. Selecting
            a size and color checks that exact combination; unavailable sizes
            are disabled.
          </p>
          <h3>Are these pieces made to order?</h3>
          <p>
            The current Hustler Dior collection is set up for production through
            Printful. <Link href="/help">Read ordering information</Link> for
            the current checkout status.
          </p>
        </section>
      )}
      <JsonLd
        data={breadcrumbData([
          { name: "Home", path: "/" },
          { name: collection.name, path },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: collection.name,
          url: absoluteUrl(canonical),
          description: collection.description,
          mainEntity: {
            "@type": "ItemList",
            numberOfItems: products.length,
            itemListElement: products.map((p, i) => ({
              "@type": "ListItem",
              position: offset + i + 1,
              name: p.name,
              url: absoluteUrl(`/products/${p.slug}`),
              item: listingProductData(p),
            })),
          },
        }}
      />
    </main>
  );
}
