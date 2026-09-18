"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import type {
  ShopifyEdit as Catalog,
  ShopifyPiece,
} from "@/lib/shopify-import";
import { money } from "@/lib/format";
import { Arrow, Close } from "./Icons";
import ProductImageZoom from "./ProductImageZoom";
import { useSavedPieces } from "@/stores/saved-pieces";

function SavePiece({ piece, ready }: { piece: ShopifyPiece; ready: boolean }) {
  const saved = useSavedPieces((state) => state.ids.includes(piece.id));
  const toggle = useSavedPieces((state) => state.toggle);
  return (
    <button
      type="button"
      className="save-piece"
      disabled={!ready}
      aria-label={`${saved ? "Unsave" : "Save"} ${piece.name}`}
      aria-pressed={saved}
      onClick={() => toggle(piece.id)}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill={saved ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M6 3h12v18l-6-4-6 4V3Z" />
      </svg>
      {saved ? "SAVED" : "SAVE"}
    </button>
  );
}

function PieceDetails({
  piece,
  ready,
}: {
  piece: ShopifyPiece;
  ready: boolean;
}) {
  const [photo, setPhoto] = useState(0);
  const [variantId, setVariantId] = useState(piece.variants[0].id);
  const variant = piece.variants.find((v) => v.id === variantId)!;
  return (
    <>
      <div className="product-options">
        <div className="curated-gallery">
          <ProductImageZoom
            key={photo}
            src={piece.images[photo]?.url ?? null}
            name={piece.name}
            label={piece.vendor}
          />
          {piece.images.length > 1 && (
            <div
              className="gallery-thumbnails"
              role="group"
              aria-label="Product photos"
            >
              {piece.images.map((img, i) => (
                <button
                  key={img.url}
                  type="button"
                  aria-label={`View photo ${i + 1}`}
                  aria-pressed={photo === i}
                  onClick={() => setPhoto(i)}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? ""}
                    fill
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="option-copy">
          <p className="eyebrow">
            {piece.vendor} / {piece.category}
          </p>
          <Dialog.Title>{piece.name}</Dialog.Title>
          <p className="option-price">
            {money(variant.priceCents, piece.currency)}
          </p>
          <label className="curated-variant-label">
            EXPLORE VARIANTS
            <select
              aria-label="Preview a variant"
              value={variantId}
              onChange={(event) => setVariantId(event.target.value)}
            >
              {piece.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title} — {money(v.priceCents, piece.currency)}
                </option>
              ))}
            </select>
          </label>
          <p className="curated-availability">NOT AVAILABLE TO ORDER</p>
          <p className="curated-note">
            Browse the details while this collection is being prepared.
          </p>
          <SavePiece piece={piece} ready={ready} />
          <details className="curated-description">
            <summary>DETAILS & MATERIALS</summary>
            <p>
              {piece.description && piece.description.trim() !== "#N/A"
                ? piece.description
                : "Product details have not been provided."}
            </p>
          </details>
        </div>
      </div>
    </>
  );
}

export default function ShopifyEdit({ catalog }: { catalog: Catalog }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All pieces");
  const [audience, setAudience] = useState("All fits");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState("newest");
  const [savedOnly, setSavedOnly] = useState(false);
  const [ready, setReady] = useState(false);
  const savedIds = useSavedPieces((state) => state.ids);
  const [selected, setSelected] = useState<ShopifyPiece | null>(null);
  const [visible, setVisible] = useState(16);
  const trigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    let mounted = true;
    Promise.resolve(useSavedPieces.persist.rehydrate())
      .catch(() => {})
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);
  const savedCount = catalog.products.filter((piece) =>
    savedIds.includes(piece.id),
  ).length;
  const audiences = ["Women", "Men", "Unisex", "Kids", "Not specified"].filter(
    (fit) => catalog.products.some((piece) => piece.audience === fit),
  );
  const categories = [
    "All pieces",
    ...new Set(catalog.products.map((p) => p.category)),
  ];
  const results = useMemo(() => {
    const filtered = catalog.products.filter(
      (p) =>
        (category === "All pieces" || category === p.category) &&
        (audience === "All fits" || audience === p.audience) &&
        (!savedOnly || savedIds.includes(p.id)) &&
        (!budget ||
          Math.min(...p.variants.map((v) => v.priceCents)) <= Number(budget)) &&
        `${p.name} ${p.vendor}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    );
    if (sort === "low" || sort === "high") {
      filtered.sort(
        (a, b) =>
          (Math.min(...a.variants.map((v) => v.priceCents)) -
            Math.min(...b.variants.map((v) => v.priceCents))) *
          (sort === "low" ? 1 : -1),
      );
    } else if (sort === "newest")
      filtered.sort(
        (a, b) =>
          (b.createdAt ? Date.parse(b.createdAt) : 0) -
          (a.createdAt ? Date.parse(a.createdAt) : 0),
      );
    else if (sort === "name")
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    return filtered;
  }, [
    catalog.products,
    query,
    category,
    audience,
    savedOnly,
    savedIds,
    budget,
    sort,
  ]);
  function resetFilters() {
    setQuery("");
    setCategory("All pieces");
    setAudience("All fits");
    setBudget("");
    setSort("newest");
    setSavedOnly(false);
    setVisible(16);
  }
  function inspect(piece: ShopifyPiece) {
    trigger.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setSelected(piece);
  }
  return (
    <section
      className="catalog-section curated-catalog"
      aria-label="Extended edit catalog"
    >
      <div className="catalog-toolbar">
        <div
          className="filter-tabs"
          role="group"
          aria-label="Filter extended edit"
        >
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? "active" : ""}
              aria-pressed={category === c}
              onClick={() => {
                setCategory(c);
                setVisible(16);
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="catalog-search">
          <label className="sr-only" htmlFor="search-extended">
            Search extended edit
          </label>
          <input
            id="search-extended"
            type="search"
            value={query}
            placeholder="Search pieces & brands"
            onChange={(e) => {
              setQuery(e.target.value);
              setVisible(16);
            }}
          />
        </div>
      </div>
      <div className="edit-discovery" aria-label="Refine your edit">
        <label>
          FIT
          <select
            value={audience}
            onChange={(event) => {
              setAudience(event.target.value);
              setVisible(16);
            }}
          >
            <option>All fits</option>
            {audiences.map((fit) => (
              <option key={fit}>{fit}</option>
            ))}
          </select>
        </label>
        <label>
          BUDGET
          <select
            value={budget}
            onChange={(event) => {
              setBudget(event.target.value);
              setVisible(16);
            }}
          >
            <option value="">All prices</option>
            {[2500, 5000, 10000].map((limit) => (
              <option value={limit} key={limit}>
                Up to {money(limit, catalog.currency)}
              </option>
            ))}
          </select>
        </label>
        <label>
          SORT
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value);
              setVisible(16);
            }}
          >
            <option value="newest">Newest first</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
        <button
          type="button"
          className="saved-filter"
          disabled={!ready}
          aria-pressed={savedOnly}
          onClick={() => {
            setSavedOnly((value) => !value);
            setVisible(16);
          }}
        >
          SAVED PIECES ({savedCount})
        </button>
        {(query ||
          category !== "All pieces" ||
          audience !== "All fits" ||
          budget ||
          savedOnly ||
          sort !== "newest") && (
          <button type="button" className="edit-reset" onClick={resetFilters}>
            RESET FILTERS ↗
          </button>
        )}
      </div>
      <div className="catalog-meta">
        <span aria-live="polite">{results.length} PIECES</span>
        <span>SAVE YOUR EDIT IN THIS BROWSER / ORDERING UNAVAILABLE</span>
      </div>
      <div className="product-grid">
        {results.slice(0, visible).map((piece) => (
          <article className="product-card curated-card" key={piece.id}>
            <div className="product-visual">
              <span className="product-index">EXTENDED EDIT</span>
              <span className="product-category">PREVIEW</span>
              <button
                type="button"
                className="product-image-button"
                onClick={() => inspect(piece)}
                aria-label={`View ${piece.name}`}
              >
                {piece.images[0] ? (
                  <Image
                    className="product-image"
                    src={piece.images[0].url}
                    alt={piece.name}
                    fill
                    sizes="(max-width: 760px) 44vw, (max-width: 1100px) 30vw, 23vw"
                  />
                ) : (
                  <span>IMAGE COMING SOON</span>
                )}
              </button>
              <button
                type="button"
                className="quick-add"
                onClick={() => inspect(piece)}
              >
                EXPLORE PIECE <Arrow width="16" height="16" />
              </button>
            </div>
            <div className="product-information">
              <div>
                <p className="product-audience">{piece.vendor}</p>
                <button
                  type="button"
                  className="product-name"
                  onClick={() => inspect(piece)}
                >
                  {piece.name}
                </button>
              </div>
              <span className="product-price">
                <small>From </small>
                {money(
                  Math.min(...piece.variants.map((v) => v.priceCents)),
                  piece.currency,
                )}
              </span>
            </div>
            <div className="curated-card-footer">
              <p className="curated-variant-count">
                {piece.variants.length}{" "}
                {piece.variants.length === 1 ? "VARIANT" : "VARIANTS"} / NOT
                AVAILABLE TO ORDER
              </p>
              <SavePiece piece={piece} ready={ready} />
            </div>
          </article>
        ))}
      </div>
      {!results.length && (
        <div className="empty-results">
          <p>
            {savedOnly && !savedCount
              ? "Your edit starts here. Save the pieces that feel like you."
              : "No pieces match these filters."}
          </p>
          <button type="button" className="edit-reset" onClick={resetFilters}>
            EXPLORE ALL PIECES ↗
          </button>
        </div>
      )}
      {visible < results.length && (
        <button
          className="load-more"
          type="button"
          onClick={() => setVisible((n) => n + 16)}
        >
          EXPLORE MORE <Arrow />
        </button>
      )}
      <Dialog.Root
        open={!!selected}
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
            <Dialog.Description className="sr-only">
              Explore product photos, variants, and supplier details. This piece
              is not available to order.
            </Dialog.Description>
            <Dialog.Close
              className="modal-close"
              aria-label="Close product details"
            >
              <Close />
            </Dialog.Close>
            {selected && (
              <PieceDetails key={selected.id} piece={selected} ready={ready} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
