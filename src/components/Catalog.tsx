"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { CatalogPage, Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import ProductOptions from "./ProductOptions";
import { Arrow, Close } from "./Icons";

export default function Catalog({
  initial,
  initialCategory = "Tees",
}: {
  initial: CatalogPage | null;
  initialCategory?: string;
}) {
  const [products, setProducts] = useState(initial?.products ?? []);
  const [next, setNext] = useState(
    initial?.paging.nextOffset ?? (initial ? null : 0),
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(12);
  const [selected, setSelected] = useState<Product | null>(null);
  const [sort, setSort] = useState("featured");
  const [size, setSize] = useState("");
  const availableOnly = Boolean(size);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const sizes = [
    ...new Set(
      products
        .filter((p) => category === "All pieces" || p.category === category)
        .flatMap((p) =>
          p.variants.filter((v) => v.stock === "available").map((v) => v.size),
        ),
    ),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  const trigger = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (next === null) return;
    const controller = new AbortController();
    fetch(`/api/products?limit=24&offset=${next}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok)
          throw new Error("We couldn’t load the rest of the collection.");
        const data: CatalogPage = await response.json();
        setProducts((current) => [
          ...current,
          ...data.products.filter(
            (p) => !current.some((existing) => existing.id === p.id),
          ),
        ]);
        setNext(data.paging.nextOffset);
        setError("");
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(error.message);
      });
    return () => controller.abort();
  }, [next, retry]);
  const results = useMemo(() => {
    const list = products.filter(
      (p) =>
        (category === "All pieces" ||
          category === p.category ||
          (category === "Women" && ["Women", "Unisex"].includes(p.audience)) ||
          (category === "Men" && ["Men", "Unisex"].includes(p.audience))) &&
        `${p.name} ${p.category} ${p.variants.map((v) => v.color).join(" ")}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()) &&
        p.variants.some(
          (v) =>
            (!size || v.size === size) &&
            (!availableOnly || v.stock === "available"),
        ),
    );
    return sort === "low"
      ? list.toSorted((a, b) => a.priceCents - b.priceCents)
      : sort === "high"
        ? list.toSorted((a, b) => b.priceCents - a.priceCents)
        : sort === "latest"
          ? list.toSorted((a, b) => b.id - a.id)
          : list;
  }, [products, category, query, sort, size, availableOnly]);
  function select(product: Product, color?: string) {
    trigger.current =
      document.activeElement instanceof HTMLButtonElement
        ? document.activeElement
        : null;
    setSelected(product);
    setSelectedColor(color);
  }
  return (
    <section
      id="collection"
      className="catalog-section"
      aria-labelledby="collection-heading"
    >
      <div className="chrome-toolbar">
        <h2 id="collection-heading">
          {category === "Tees" ? "GRAPHIC TEES" : "THE COLLECTION"}
        </h2>
        <label>
          <span className="sr-only">Product category</span>
          <select
            aria-label="Product category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setVisible(12);
            }}
          >
            <option value="Tees">All tees</option>
            <option value="All pieces">All products</option>
            {[...new Set(products.map((p) => p.category))]
              .filter((c) => c !== "Tees")
              .map((c) => (
                <option key={c}>{c}</option>
              ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Available size</span>
          <select
            aria-label="Filter by size"
            value={size}
            onChange={(e) => {
              setSize(e.target.value);
              setVisible(12);
            }}
          >
            <option value="">All sizes</option>
            {sizes.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Sort collection</span>
          <select
            aria-label="Sort collection"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="featured">Sort: Featured</option>
            <option value="latest">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>
      <div className="chrome-search-row">
        <label className="sr-only" htmlFor="search-pieces">
          Search pieces
        </label>
        <input
          id="search-pieces"
          type="search"
          placeholder="Search the collection"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisible(12);
          }}
        />
        <span role="status">
          {next !== null && !error
            ? "Loading collection…"
            : `${results.length} pieces`}
        </span>
        {(query || size) && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSize("");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      {error && (
        <div className="catalog-error" role="status">
          {error}{" "}
          <button
            type="button"
            onClick={() => {
              setError("");
              setRetry((r) => r + 1);
            }}
          >
            Try again
          </button>
        </div>
      )}
      <div className="product-grid">
        {results.slice(0, visible).map((product, i) => (
          <ProductCard
            key={product.id}
            product={product}
            index={i}
            onSelect={select}
          />
        ))}
      </div>
      {!results.length && next === null && (
        <p className="empty-results">
          No pieces match that search. Try another name or collection.
        </p>
      )}
      {visible < results.length && (
        <button
          type="button"
          className="load-more"
          onClick={() => setVisible((v) => v + 12)}
        >
          MORE FROM THE COLLECTION <Arrow />
        </button>
      )}
      <Dialog.Root
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="modal-overlay" />
          <Dialog.Content
            className="product-modal"
            data-lenis-prevent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
          >
            <Dialog.Title className="sr-only">
              {selected?.name ?? "Product details"}
            </Dialog.Title>
            <Dialog.Description className="sr-only">
              Choose your color and size to add this piece to your bag.
            </Dialog.Description>
            <Dialog.Close
              className="modal-close"
              aria-label="Close product details"
            >
              <Close />
            </Dialog.Close>
            {selected && (
              <>
                <ProductOptions
                  key={selected.id}
                  product={selected}
                  initialColor={selectedColor}
                  onAdded={() => setSelected(null)}
                />
                <Link
                  className="full-product-link"
                  href={`/products/${selected.slug}`}
                >
                  VIEW FULL PRODUCT DETAILS <Arrow />
                </Link>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
