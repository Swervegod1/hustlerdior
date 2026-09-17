import Link from "next/link";
import { createElement } from "react";
import type { PrintfulProduct } from "@/src/lib/printful/types";
import { PrintfulClient } from "@/src/lib/printful/client";

type ProductCardProps = {
  product: PrintfulProduct;
};

export class ProductCard {
  static render({ product }: ProductCardProps) {
    const media = product.imageUrl
      ? createElement("img", { src: product.imageUrl, alt: product.name })
      : createElement(
          "span",
          { className: "product-card__placeholder" },
          "Concrete / Edit",
        );

    return createElement(
      Link,
      { href: `/product/${product.id}`, className: "product-card" },
      createElement("div", { className: "product-card__media" }, media),
      createElement(
        "div",
        { className: "product-card__body" },
        createElement("h3", { className: "product-card__name" }, product.name),
        createElement(
          "div",
          { className: "product-card__meta" },
          createElement("span", null, product.category),
          createElement(
            "span",
            { className: "product-card__price" },
            PrintfulClient.formatPrice(product),
          ),
        ),
      ),
    );
  }
}

export default function ProductCardComponent(props: ProductCardProps) {
  return ProductCard.render(props);
}
