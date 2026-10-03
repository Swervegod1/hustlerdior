import { detailLinesFor } from "@/lib/verified-specs";

export default function ProductDetails({ productId }: { productId: number }) {
  const lines = detailLinesFor(productId);
  if (!lines.length) return null;
  return (
    <section
      className="product-details"
      aria-labelledby="product-details-heading"
    >
      <h2 id="product-details-heading">Product details</h2>
      <dl>
        {lines.map((line) => (
          <div key={line.key}>
            <dt>{line.label}</dt>
            <dd>{line.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
