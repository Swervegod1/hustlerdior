import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { productForPage } from "@/lib/server/catalog";
import ProductOptions from "@/components/ProductOptions";
import { connection } from "next/server";
import {
  absoluteUrl,
  breadcrumbData,
  productData,
  productDescription,
} from "@/lib/seo";
import { collections } from "@/lib/collections";
import JsonLd from "@/components/JsonLd";
import { metadata as notFoundMetadata } from "@/app/not-found";
import snapshot from "@/data/catalog-snapshot.json";
import { catalogDocumentTitles } from "@/lib/product-title";
import type { Product } from "@/lib/types";

const titlePeers = (snapshot.products as Product[]).map((product) => ({
  id: product.id,
  name: product.name,
}));

function catalogFor(product: Product) {
  return titlePeers.some((item) => item.id === product.id)
    ? titlePeers.map((item) =>
        item.id === product.id
          ? { id: product.id, name: product.name }
          : item,
      )
    : [...titlePeers, { id: product.id, name: product.name }];
}

function withDocumentTitle(product: Product): Product {
  return {
    ...product,
    name:
      catalogDocumentTitles(catalogFor(product)).get(product.id) ??
      product.name,
  };
}

async function resolve(slug: string) {
  await connection();
  const id = slug.match(/-(\d{1,15})$/)?.[1];
  if (!id) return null;
  return productForPage(Number(id));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await resolve(slug);
  // Throw notFound() only from the page. Doing it here renders Next's empty
  // __next_error__ shell instead of the not-found document.
  if (!product) return notFoundMetadata;
  const titled = withDocumentTitle(product);
  return {
    title: titled.name,
    description: productDescription(titled),
    alternates: { canonical: absoluteUrl(`/products/${product.slug}`) },
    openGraph: {
      title: titled.name,
      description: productDescription(titled),
      url: absoluteUrl(`/products/${product.slug}`),
      type: "website",
      images: product.image ? [{ url: product.image, alt: titled.name }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: titled.name,
      description: productDescription(titled),
      images: product.image ? [product.image] : [],
    },
  };
}
export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    variant?: string | string[];
    color?: string | string[];
  }>;
}) {
  const { slug } = await params;
  const product = await resolve(slug);
  if (!product) notFound();
  const titled = withDocumentTitle(product);
  if (slug !== product.slug) permanentRedirect(`/products/${product.slug}`);
  const query = await searchParams;
  const variantId =
    typeof query.variant === "string" && /^\d{1,15}$/.test(query.variant)
      ? Number(query.variant)
      : undefined;
  if (
    query.variant !== undefined &&
    !product.variants.some((v) => v.id === variantId)
  )
    permanentRedirect(`/products/${product.slug}`);
  const collection = collections.find((c) => c.matches(product));
  const initialColor =
    typeof query.color === "string" &&
    product.variants.some((v) => v.color === query.color)
      ? query.color
      : undefined;
  const crumbs = [
    { name: "Home", path: "/" },
    ...(collection
      ? [{ name: collection.name, path: `/collections/${collection.slug}` }]
      : []),
    { name: titled.name, path: `/products/${product.slug}` },
  ];
  return (
    <main id="main" className="product-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c.path}>
            {i > 0 && " / "}
            {i === crumbs.length - 1 ? (
              c.name
            ) : (
              <Link href={c.path}>{c.name}</Link>
            )}
          </span>
        ))}
      </nav>
      <ProductOptions
        key={`${product.id}-${variantId ?? "default"}-${initialColor ?? "default"}`}
        product={titled}
        initialVariantId={variantId}
        initialColor={initialColor}
        page
      />
      <section className="reading-panel product-reading">
        <p>{productDescription(titled)}</p>
        <h2>FIND YOUR FIT.</h2>
        <p>
          Each color can have a different size range. Choose both before adding
          a piece to your bag. Availability and price are checked again when you
          add it.
        </p>
        <Link href="/fit-guide">Fit guide ↗</Link>
        <span> · </span>
        <Link href="/help">Ordering information ↗</Link>
      </section>
      <JsonLd data={productData(titled)} />
      <JsonLd data={breadcrumbData(crumbs)} />
    </main>
  );
}
