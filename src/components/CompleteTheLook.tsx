"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { useCart } from "@/stores/cart";
import type { Product } from "@/lib/types";
import { money, shortName } from "@/lib/format";
import { addOnVariants, selectedAddOn } from "@/lib/merchandising";
import ProductOptions from "./ProductOptions";
import TryOnButton from "./TryOnButton";
import { Close } from "./Icons";

export default function CompleteTheLook({
  placement = "bag",
}: {
  placement?: "bag" | "checkout";
}) {
  const lines = useCart((s) => s.lines);
  const add = useCart((s) => s.add);
  const ids = [...new Set(lines.map((l) => l.productId))].sort().join(",");
  const currency = lines[0]?.currency ?? "USD";
  const requestKey = `${ids}:${currency}`;
  const [result, setResult] = useState<{ key: string; products: Product[] }>({
    key: "",
    products: [],
  });
  const [selected, setSelected] = useState<Product | null>(null);
  const [variantIds, setVariantIds] = useState<Record<number, number>>({});
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!ids) return;
    const controller = new AbortController();
    fetch(
      `/api/recommendations?products=${encodeURIComponent(ids)}&currency=${encodeURIComponent(currency)}`,
      {
        signal: controller.signal,
      },
    )
      .then((response) => (response.ok ? response.json() : { products: [] }))
      .then((data) => {
        if (!controller.signal.aborted)
          setResult({ key: requestKey, products: data.products ?? [] });
      })
      .catch(() => {});
    return () => controller.abort();
  }, [ids, currency, requestKey]);
  const available = (result.key === requestKey ? result.products : []).filter(
    (p) =>
      p.currency === currency &&
      addOnVariants(p, currency).length > 0 &&
      !lines.some((l) => l.productId === p.id),
  );
  if (!available.length && !selected && !notice) return null;
  function quickAdd(product: Product) {
    const variant = selectedAddOn(product, currency, variantIds[product.id]);
    if (!variant) return;
    setNotice(
      add(product, variant)
        ? `${shortName(product.name)} added to your bag.`
        : "This piece could not be added. Check your bag quantities.",
    );
  }
  return (
    <section
      className={`complete-look sales-addons sales-addons-${placement}`}
      aria-label="Optional complementary pieces"
    >
      <div className="complete-look-heading">
        <span className="eyebrow">THE FINISHING TOUCH</span>
        <h3>COMPLETE THE LOOK.</h3>
        <p>A little extra expression. Every add-on is your choice.</p>
      </div>
      <p className="addon-notice" role="status">
        {notice}
      </p>
      {available.map((product) => {
        const variants = addOnVariants(product, currency);
        const variant = selectedAddOn(
          product,
          currency,
          variantIds[product.id],
        );
        return (
          <div className="addon-piece" key={product.id}>
            <button
              type="button"
              className="addon-image"
              onClick={() => setSelected(product)}
              aria-label={`Choose ${product.name}`}
            >
              {(variant?.image || product.image) && (
                <Image
                  src={(variant?.image || product.image)!}
                  alt={product.name}
                  fill
                  sizes="110px"
                />
              )}
            </button>
            <div className="addon-info">
              <span className="addon-category">{product.category}</span>
              <h4>{shortName(product.name)}</h4>
              <p>
                {variant
                  ? money(variant.priceCents, product.currency)
                  : `From ${money(Math.min(...variants.map((v) => v.priceCents)), product.currency)}`}
              </p>
              {variants.length > 1 && (
                <label
                  className="addon-variant-label"
                  htmlFor={`addon-variant-${placement}-${product.id}`}
                >
                  <span className="sr-only">Options for {product.name}</span>
                  <select
                    id={`addon-variant-${placement}-${product.id}`}
                    value={variant?.id ?? ""}
                    onChange={(event) =>
                      setVariantIds((current) => ({
                        ...current,
                        [product.id]: Number(event.target.value),
                      }))
                    }
                  >
                    <option value="" disabled>
                      Choose color / size
                    </option>
                    {variants.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.color} / {option.size} ·{" "}
                        {money(option.priceCents, option.currency)}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                className="addon-add-button"
                disabled={!variant}
                onClick={() => quickAdd(product)}
                aria-label={
                  variant
                    ? `Add ${product.name}, ${variant.color}, ${variant.size} to bag`
                    : `Choose options for ${product.name} before adding`
                }
              >
                {variant
                  ? `+ ADD · ${money(variant.priceCents, variant.currency)}`
                  : "SELECT YOUR FIT"}
              </button>
              <button
                type="button"
                className="addon-choose"
                onClick={() => setSelected(product)}
              >
                VIEW DETAILS ↗
              </button>
              <TryOnButton product={product} compact />
            </div>
          </div>
        );
      })}
      <Dialog.Root
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay addon-overlay" />
          <Dialog.Content
            className="product-modal addon-modal"
            data-lenis-prevent
          >
            <Dialog.Title className="sr-only">
              Choose your complementary piece
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Select a color and size, review the price, then add the piece to
              your bag.
            </Dialog.Description>
            <Dialog.Close
              className="modal-close icon-button"
              aria-label="Close piece"
            >
              <Close />
            </Dialog.Close>
            {selected && (
              <ProductOptions
                key={selected.id}
                product={selected}
                onAdded={() => setSelected(null)}
              />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
