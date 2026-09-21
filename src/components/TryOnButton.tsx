"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { Product } from "@/lib/types";
const TryOnDialog = dynamic(() => import("./TryOnDialog"), { ssr: false });
export default function TryOnButton({
  product,
  variantId,
  compact = false,
}: {
  product: Product;
  variantId?: number;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`tryon-button${compact ? " compact" : ""}`}
        onClick={() => setOpen(true)}
        aria-label={`Try on ${product.name}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="m15 4 2 4 4 2-4 2-2 4-2-4-4-2 4-2 2-4ZM5 14l1.5 3L10 19l-3.5 1.5L5 24l-1.5-3.5L0 19l3.5-2L5 14Z" />
        </svg>
        TRY ON <span>AI</span>
      </button>
      {open && (
        <TryOnDialog
          product={product}
          initialVariantId={variantId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
