"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import type { CatalogPage, Product } from "@/lib/types";
import ProductCard from "./ProductCard";
import ProductOptions from "./ProductOptions";
import { Arrow, Close } from "./Icons";

export default function Catalog({ initial }: { initial: CatalogPage | null }) {
  const [products, setProducts] = useState(initial?.products ?? []);
  const [next, setNext] = useState(
    initial?.paging.nextOffset ?? (initial ? null : 0),
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [category, setCategory] = useState("All pieces");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(12);
  const [selected, setSelected] = useState<Product | null>(null);
  const [sort, setSort] = useState("latest");
  const [size, setSize] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const sizes = [
    ...new Set(products.flatMap((p) => p.variants.map((v) => v.size))),
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
      <div className="section-topline">
        <span>THE WARDROBE / VOLUME 01</span>
        <span>YOUR NEXT SIGNATURE PIECE.</span>
      </div>
      <div className="collection-heading">
        <h2 id="collection-heading">
          THE COLLECTION<span>({products.length || "—"})</span>
        </h2>
        <p>
          Heavy on expression.
          <br />
          Made for your everyday.
        </p>
      </div>
      <div className="catalog-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filter collection"
        >
          {[
            "All pieces",
            "Tees",
            "Layers",
            "Bottoms",
            "Accessories",
            "Women",
            "Men",
          ].map((c) => (
            <button
              type="button"
              key={c}
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c);
                setVisible(12);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="catalog-search">
          <label className="sr-only" htmlFor="search-pieces">
            Search pieces
          </label>
          <input
            id="search-pieces"
            type="search"
            placeholder="Find your piece"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(12);
            }}
          />
        </div>
      </div>
      <div className="catalog-refine">
        <label>
          YOUR SIZE{" "}
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
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="availability-filter">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked);
              setVisible(12);
            }}
          />{" "}
          Available to order
        </label>
        {(size || availableOnly || query || category !== "All pieces") && (
          <button
            type="button"
            onClick={() => {
              setSize("");
              setAvailableOnly(false);
              setQuery("");
              setCategory("All pieces");
              setVisible(12);
            }}
          >
            CLEAR FILTERS ×
          </button>
        )}
      </div>
      <div className="catalog-meta">
        <span aria-live="polite">
          {next !== null && !error
            ? "LOADING COLLECTION…"
            : `${results.length} ${results.length === 1 ? "PIECE" : "PIECES"}`}
          {initial?.source === "snapshot" ? " / CATALOG PREVIEW" : ""}
        </span>
        <label>
          SORT BY{" "}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort collection"
          >
            <option value="latest">Latest in store</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
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
