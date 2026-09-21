import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createElement } from "react";
import AddToBag from "@/components/AddToBag";
import { PrintfulClient } from "@/src/lib/printful/client";
import { checkoutStatus } from "@/src/lib/stripe";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: ProductPageProps) {
  const { id } = await params;
  const product = await PrintfulClient.fetchProduct(id);
  if (!product) {
    return { title: "Product not found" } satisfies Metadata;
  }
  return {
    title: product.name,
    description: product.description,
  } satisfies Metadata;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await PrintfulClient.fetchProduct(id);

  if (!product) {
    notFound();
  }

  const media = product.imageUrl
    ? createElement("img", { src: product.imageUrl, alt: product.name })
    : createElement("span", { className: "pdp__placeholder" }, "Concrete / Edit");
  const checkout = checkoutStatus();

  return createElement(
    "div",
    { className: "container pdp" },
    createElement("div", { className: "pdp__media" }, media),
    createElement(
      "div",
      null,
      createElement("p", { className: "pdp__eyebrow" }, product.category),
      createElement("h1", null, product.name),
      createElement("p", { className: "pdp__price" }, PrintfulClient.formatPrice(product)),
      createElement("p", { className: "pdp__desc" }, product.description),
      createElement(AddToBag, {
        product,
        checkoutConfigured: checkout.configured,
      }),
      createElement(
        "p",
        { className: "pdp__note" },
        "Made-to-order · Printful fulfillment · ",
        product.mock ? "Mock drop" : "Live sync",
      ),
      createElement(
        "p",
        { className: "pdp__note" },
        createElement(Link, { href: "/collection" }, "Back to collection"),
      ),
    ),
  );
}
