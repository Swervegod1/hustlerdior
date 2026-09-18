"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { money } from "@/lib/format";
import { useCart, useUI } from "@/stores/cart";
import { sound } from "@/lib/audio";
import { Arrow } from "./Icons";
import TryOnButton from "./TryOnButton";
import ProductImageZoom from "./ProductImageZoom";

export default function ProductOptions({
  product,
  onAdded,
  initialVariantId,
  initialColor,
  page = false,
}: {
  product: Product;
  onAdded?: () => void;
  initialVariantId?: number;
  initialColor?: string;
  page?: boolean;
}) {
  const initial = product.variants.find((v) => v.id === initialVariantId);
  const first =
    initial ??
    product.variants.find(
      (v) => v.color === initialColor && v.stock === "available",
    ) ??
    product.variants.find((v) => v.color === initialColor) ??
    product.variants.find((v) => v.stock === "available") ??
    product.variants[0];
  const [color, setColor] = useState(first.color);
  const [size, setSize] = useState<string | null>(
    initial || product.variants.length === 1 ? first.size : null,
  );
  const [message, setMessage] = useState("");
  const [adding, setAdding] = useState(false);
  const selected = product.variants.find(
    (v) => v.color === color && v.size === size,
  );
  const colorVariants = product.variants.filter((v) => v.color === color);
  const display = selected ?? colorVariants[0];
  const image = display?.image ?? product.image;
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const add = useCart((s) => s.add);
  const Heading = page ? "h1" : "h2";
  async function addToBag() {
    if (!selected) {
      setMessage("Choose a size to add this piece.");
      return;
    }
    setAdding(true);
    setMessage("");
    try {
      // Refresh product data at the boundary; the server re-prices again at checkout.
      const response = await fetch(`/api/products/${product.id}`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(
          "We couldn’t check this piece right now. Please try again.",
        );
      const { product: fresh }: { product: Product } = await response.json();
      const variant = fresh.variants.find((v) => v.id === selected.id);
      if (!variant || variant.stock !== "available")
        throw new Error(
          "This size is currently unavailable. Try another size.",
        );
      if (
        variant.priceCents !== selected.priceCents ||
        variant.currency !== selected.currency
      )
        throw new Error(
          "The price has changed. Refresh the collection before adding this piece.",
        );
      if (!add(fresh, variant))
        throw new Error(
          "Your bag has reached its limit, or contains a different currency.",
        );
      sound(useUI.getState().audio, "add");
      onAdded?.();
      useUI.getState().openBag(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setAdding(false);
    }
  }
  return (
    <div className="product-options">
      <ProductImageZoom
        key={image ?? product.id}
        src={image}
        name={`${product.name} in ${color}`}
        label={`HUSTLER DIOR / ${product.category.toUpperCase()}`}
      />
      <div className="option-copy">
        <p className="eyebrow">
          {product.audience.toUpperCase()} / {product.category.toUpperCase()}
        </p>
        <Heading>{product.name}</Heading>
        <p className="option-price">
          {money(display.priceCents, display.currency)}
        </p>
        <fieldset>
          <legend>
            COLOR <span>{color}</span>
          </legend>
          <div className="color-options">
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                className={color === c ? "selected" : ""}
                aria-pressed={color === c}
                onClick={() => {
                  setColor(c);
                  setMessage("");
                  if (
                    !product.variants.some(
                      (v) =>
                        v.color === c &&
                        v.size === size &&
                        v.stock === "available",
                    )
                  )
                    setSize(null);
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            SIZE <span>{size ?? "Select your fit"}</span>
          </legend>
          <div className="size-options">
            {colorVariants.map((v) => (
              <button
                type="button"
                key={v.id}
                disabled={v.stock !== "available"}
                className={selected?.id === v.id ? "selected" : ""}
                aria-pressed={selected?.id === v.id}
                aria-label={`${v.size}${v.stock !== "available" ? " unavailable" : ""}`}
                onClick={() => {
                  setSize(v.size);
                  setMessage("");
                }}
              >
                {v.size}
              </button>
            ))}
          </div>
        </fieldset>
        <p className="stock-copy">
          {selected
            ? selected.stock === "available"
              ? "Available to order"
              : "Currently unavailable"
            : "Choose a size to check availability"}
        </p>
        <Link href="/fit-guide" className="fit-guide-link">
          FIND YOUR FIT <span aria-hidden="true">↗</span>
        </Link>
        <button
          type="button"
          className="primary-button add-to-bag"
          disabled={!selected || selected.stock !== "available" || adding}
          onClick={addToBag}
        >
          {adding ? "CHECKING AVAILABILITY…" : "ADD TO BAG"}
          <Arrow />
        </button>
        <TryOnButton product={product} variantId={display.id} />
        <p className="form-message" role="status">
          {message}
        </p>
        <div className="product-notes">
          <p>Made to order through Printful.</p>
          <p>
            Choose your pieces, then review delivery and checkout availability
            in your bag.
          </p>
          <p>Original Hustler Dior collection.</p>
        </div>
      </div>
    </div>
  );
}
