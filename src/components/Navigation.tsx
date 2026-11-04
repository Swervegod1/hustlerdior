"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart, useUI } from "@/stores/cart";
import { MagnifyingGlass, ShoppingBag, List } from "@phosphor-icons/react";
import BrandCrest from "./BrandCrest";
export default function Navigation() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const path = usePathname();
  return (
    <header className="chrome-navigation">
      <Link href="/" aria-label="Hustler Dior home">
        <BrandCrest />
      </Link>
      <nav aria-label="Main navigation" className="chrome-main-nav">
        <Link
          href="/?collection=all#collection"
          aria-current={path === "/" ? "page" : undefined}
        >
          Shop all
        </Link>
        <Link
          href="/collections/tees"
          aria-current={path === "/collections/tees" ? "page" : undefined}
        >
          Graphic tees
        </Link>
      </nav>
      <div className="chrome-nav-actions">
        <Link href="/#search-pieces" aria-label="Search the collection">
          <MagnifyingGlass size={25} weight="light" />
        </Link>
        <button
          type="button"
          onClick={() => useUI.getState().openBag(true)}
          aria-label={`Open bag, ${count} items`}
        >
          <ShoppingBag size={25} weight="light" />
          <span className="chrome-bag-count" aria-live="polite">
            {count}
          </span>
        </button>
        <details className="chrome-mobile-menu">
          <summary aria-label="Shop categories">
            <List size={25} weight="light" />
          </summary>
          <nav aria-label="Mobile collection navigation">
            <Link href="/?collection=all#collection">Shop all</Link>
            <Link href="/collections/tees">Graphic tees</Link>
            <Link href="/collections/hoodies-layers">Hoodies & layers</Link>
            <Link href="/collections/accessories">Accessories</Link>
            <Link href="/about">About us</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
