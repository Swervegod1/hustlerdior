"use client";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useState, type PointerEvent } from "react";
import type { Product } from "@/lib/types";
import { money, shortName } from "@/lib/format";
import { useCart, useUI } from "@/stores/cart";
import { sound } from "@/lib/audio";
import { Arrow } from "./Icons";
import TryOnButton from "./TryOnButton";

export default function ProductCard({
  product,
  index = 0,
  onSelect,
}: {
  product: Product;
  index?: number;
  onSelect: (product: Product, color?: string) => void;
}) {
  const reduced = useReducedMotion();
  const rx = useMotionValue(0),
    ry = useMotionValue(0),
    mx = useMotionValue(50),
    my = useMotionValue(50);
  const rotateX = useSpring(rx, { stiffness: 150, damping: 22 });
  const rotateY = useSpring(ry, { stiffness: 150, damping: 22 });
  const reflection = useMotionTemplate`radial-gradient(circle at ${mx}% ${my}%, rgba(255,255,255,.32), transparent 65%)`;
  const variants = product.variants.filter((v) => v.stock === "available");
  const colors = [...new Set(product.variants.map((v) => v.color))];
  const add = useCart((s) => s.add);
  const audio = useUI((s) => s.audio);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [previewColor, setPreviewColor] = useState<string | undefined>();
  const preview = product.variants.find((v) => v.color === previewColor);
  const displayedImage = preview?.image ?? product.image;
  const displayedVariants = preview
    ? product.variants.filter((v) => v.color === previewColor)
    : product.variants;
  const lowPrice = Math.min(...displayedVariants.map((v) => v.priceCents));
  const highPrice = Math.max(...displayedVariants.map((v) => v.priceCents));
  const openDetails = () => onSelect(product, previewColor);
  function move(e: PointerEvent<HTMLElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - box.left) / box.width,
      y = (e.clientY - box.top) / box.height;
    rx.set((0.5 - y) * 8);
    ry.set((x - 0.5) * 8);
    mx.set(x * 100);
    my.set(y * 100);
  }
  async function quickAdd() {
    if (product.variants.length !== 1 || variants.length !== 1)
      return openDetails();
    setAdding(true);
    setMessage("");
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error("Availability check failed. Please try again.");
      const { product: fresh }: { product: Product } = await response.json();
      const variant = fresh.variants.find((v) => v.id === variants[0].id);
      if (!variant || variant.stock !== "available")
        throw new Error("This piece is currently unavailable.");
      if (
        variant.priceCents !== variants[0].priceCents ||
        variant.currency !== variants[0].currency
      )
        throw new Error(
          "The price changed. Refresh the collection to continue.",
        );
      if (!add(fresh, variant))
        throw new Error(
          "Your bag has reached its limit, or contains another currency.",
        );
      sound(audio, "add");
      useUI.getState().openBag(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Please try again.");
    } finally {
      setAdding(false);
    }
  }
  return (
    <article
      className="product-card"
      onPointerMove={move}
      onPointerLeave={() => {
        rx.set(0);
        ry.set(0);
        mx.set(50);
        my.set(50);
      }}
    >
      <motion.div
        className="product-visual"
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      >
        <span className="product-index">
          HD / {String(index + 1).padStart(3, "0")}
        </span>
        <span className="product-category">
          {product.category.toUpperCase()}
        </span>
        <button
          type="button"
          className="product-image-button"
          onClick={openDetails}
          aria-label={`View ${product.name}`}
        >
          {displayedImage ? (
            <Image
              key={displayedImage}
              src={displayedImage}
              alt={`${product.name}${previewColor ? ` in ${previewColor}` : ""}`}
              fill
              sizes="(max-width: 760px) 44vw, (max-width: 1100px) 30vw, 23vw"
              className="product-image"
            />
          ) : (
            <span className="image-unavailable">IMAGE COMING SOON</span>
          )}
        </button>
        <motion.div
          className="product-reflection"
          style={{ background: reflection }}
          aria-hidden="true"
        />
        <span className="product-grain" aria-hidden="true" />
        <button
          type="button"
          className="quick-add"
          onClick={quickAdd}
          disabled={!variants.length || adding}
          aria-label={`${variants.length ? "Quick add" : "Unavailable"}: ${product.name}`}
        >
          <span>
            {adding
              ? "CHECKING…"
              : variants.length
                ? product.variants.length > 1
                  ? "CHOOSE YOUR FIT"
                  : "QUICK ADD"
                : "UNAVAILABLE"}
          </span>
          <span className="plus">+</span>
        </button>
      </motion.div>
      {colors.length > 1 && (
        <div
          className="card-color-previews"
          role="group"
          aria-label={`Preview colors for ${product.name}`}
        >
          {colors.slice(0, 4).map((color) => {
            const variant = product.variants.find((v) => v.color === color);
            return (
              <button
                key={color}
                type="button"
                aria-label={`Preview ${color}`}
                title={color}
                aria-pressed={previewColor === color}
                onClick={() => setPreviewColor(color)}
              >
                {variant?.image ? (
                  <Image src={variant.image} alt="" fill sizes="32px" />
                ) : (
                  <span>{color.slice(0, 2)}</span>
                )}
              </button>
            );
          })}
          {colors.length > 4 && (
            <button
              type="button"
              className="more-colors"
              onClick={openDetails}
              aria-label={`View all ${colors.length} colors`}
            >
              +{colors.length - 4}
            </button>
          )}
        </div>
      )}
      <div className="product-information">
        <div>
          <p className="product-audience">
            {product.audience} / {colors.length}{" "}
            {colors.length === 1 ? "color" : "colors"}
          </p>
          <Link href={`/products/${product.slug}`} className="product-name">
            {shortName(product.name)}
          </Link>
        </div>
        <span className="product-price">
          {lowPrice !== highPrice && <small>From </small>}
          {money(lowPrice, product.currency)}
        </span>
      </div>
      <div className="product-card-actions">
        <button
          type="button"
          className="product-detail-link"
          onClick={openDetails}
        >
          VIEW PIECE <Arrow width="15" height="15" />
        </button>
        <TryOnButton product={product} compact />
      </div>
      {message && (
        <p className="form-message" role="status">
          {message}
        </p>
      )}
    </article>
  );
}
