import Link from "next/link";
import type { PrintfulProduct } from "@/src/lib/printful/types";
import { PrintfulClient } from "@/src/lib/printful/client";

type ProductCardProps = {
  product: PrintfulProduct;
};

export class ProductCard {
  static render({ product }: ProductCardProps) {
    return (
      <Link href={`/product/${product.id}`} className="product-card">
        <div className="product-card__media">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <span className="product-card__placeholder">Concrete / Edit</span>
          )}
        </div>
        <div className="product-card__body">
          <h3 className="product-card__name">{product.name}</h3>
          <div className="product-card__meta">
            <span>{product.category}</span>
            <span className="product-card__price">
              {PrintfulClient.formatPrice(product)}
            </span>
          </div>
        </div>
      </Link>
    );
  }
}

export default function ProductCardComponent(props: ProductCardProps) {
  return ProductCard.render(props);
}
