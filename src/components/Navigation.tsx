"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useCart, useUI } from "@/stores/cart";
import { MagnifyingGlass, ShoppingBag, List } from "@phosphor-icons/react";
import BrandCrest from "./BrandCrest";
import { directoryGroups } from "@/lib/navigation";
export default function Navigation() {
  const header = useRef<HTMLElement>(null);
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const path = usePathname();
  function closeMenus() {
    header.current?.querySelectorAll("details[open]").forEach((menu) => {
      menu.removeAttribute("open");
    });
  }
  useEffect(() => {
    function outsideClick(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      ) {
        closeMenus();
      }
    }
    document.addEventListener("click", outsideClick);
    return () => document.removeEventListener("click", outsideClick);
  }, []);
  function directoryLink(link: { href: string; label: string }) {
    return (
      <Link
        key={link.href}
        href={link.href}
        aria-current={path === link.href ? "page" : undefined}
        onClick={closeMenus}
      >
        {link.label}
      </Link>
    );
  }
  return (
    <header
      className="chrome-navigation"
      ref={header}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          const menu = (event.target as HTMLElement).closest("details[open]");
          closeMenus();
          menu?.querySelector("summary")?.focus();
        }
      }}
    >
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
        {directoryGroups.map((group) => (
          <details
            key={group.label}
            className="chrome-directory"
            onToggle={(event) => {
              if (event.currentTarget.open) {
                header.current
                  ?.querySelectorAll("details[open]")
                  .forEach((menu) => {
                    if (menu !== event.currentTarget)
                      menu.removeAttribute("open");
                  });
              }
            }}
          >
            <summary
              data-active={
                group.links.some((link) => link.href === path) || undefined
              }
            >
              {group.label} <span aria-hidden="true">⌄</span>
            </summary>
            <div className="chrome-directory-panel">
              {group.links.map(directoryLink)}
            </div>
          </details>
        ))}
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
            <Link href="/?collection=all#collection" onClick={closeMenus}>
              Shop all
            </Link>
            {directoryGroups.map((group) => (
              <div className="chrome-directory-group" key={group.label}>
                <span className="chrome-directory-label">{group.label}</span>
                {group.links.map(directoryLink)}
              </div>
            ))}
          </nav>
        </details>
      </div>
    </header>
  );
}
