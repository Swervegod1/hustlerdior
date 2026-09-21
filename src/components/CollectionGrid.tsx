"use client";
import type { Product } from "@/lib/types";
import { useRouter } from "next/navigation";
import ProductCard from "./ProductCard";

export default function CollectionGrid({
  products,
  offset,
}: {
  products: Product[];
  offset: number;
}) {
  const router = useRouter();
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={product.id}
          product={product}
          index={offset + index}
          onSelect={(p, color) =>
            router.push(
              `/products/${p.slug}${color ? `?color=${encodeURIComponent(color)}` : ""}`,
            )
          }
        />
      ))}
    </div>
  );
}
