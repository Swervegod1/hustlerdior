"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { Product } from "@/lib/types";
import { money, shortName } from "@/lib/format";
import { useCart, useUI } from "@/stores/cart";

export default function ProductCard({
  product,
  index = 0,
  onSelect,
}: {
  product: Product;
  index?: number;
  onSelect: (product: Product, color?: string) => void;
}) {
  const variants = product.variants.filter((v) => v.stock === "available");
  const preview =
    variants.find((v) => /black/i.test(v.color)) ??
    variants[0] ??
    product.variants[0];
  const image = preview?.image ?? product.image;
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const openDetails = () => onSelect(product, preview?.color);
  async function quickAdd() {
    // Multi-variant pieces always require an explicit size/color selection.
    if (product.variants.length !== 1 || variants.length !== 1)
      return openDetails();
    const target = variants[0];
    setAdding(true);
    setMessage("");
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("Availability check failed. Please try again.");
      const { product: fresh }: { product: Product } = await response.json();
      const variant = fresh.variants.find((v) => v.id === target.id);
      if (!variant || variant.stock !== "available")
        throw new Error("This piece is currently unavailable.");
      if (
        variant.priceCents !== target.priceCents ||
        variant.currency !== target.currency
      )
        throw new Error(
          "The price changed. Refresh the collection to continue.",
        );
      if (!useCart.getState().add(fresh, variant))
        throw new Error(
          "Your bag has reached its limit, or contains another currency.",
        );
      setMessage("Added to your bag.");
      useUI.getState().openBag(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setAdding(false);
    }
  }
  const low = Math.min(...product.variants.map((v) => v.priceCents));
  const high = Math.max(...product.variants.map((v) => v.priceCents));
  return (
    <article className="chrome-card">
      <button
        className="chrome-product-image"
        type="button"
        onClick={openDetails}
        aria-label={`View ${product.name}`}
      >
        {image ? (
          <Image
            src={image}
            alt={`${product.name}${preview ? ` in ${preview.color}` : ""}`}
            fill
            sizes="(max-width: 599px) 49vw, (max-width: 1023px) 32vw, 24vw"
            priority={index < 4}
          />
        ) : (
          <span>Image unavailable</span>
        )}
        {!variants.length && <span className="chrome-stock">Sold out</span>}
      </button>
      <div className="chrome-card-info">
        <div>
          <Link
            href={`/products/${product.slug}`}
            className="chrome-product-name"
          >
            {shortName(product.name).split("|")[0].trim()}
          </Link>
          <p className="chrome-price">
            {low !== high ? "From " : ""}
            {money(low, product.currency)}
          </p>
        </div>
        <button
          className="chrome-quick-add"
          type="button"
          onClick={quickAdd}
          disabled={adding || !variants.length}
          aria-label={`Quick add: ${product.name}`}
          aria-busy={adding}
        >
          <Plus size={23} weight="light" />
        </button>
      </div>
      <p className="chrome-card-feedback" role="status">
        {message}
      </p>
    </article>
  );
}
