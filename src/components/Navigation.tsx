"use client";
import Link from "next/link";
import { useCart, useUI } from "@/stores/cart";
import { sound } from "@/lib/audio";
import { AudioIcon, Bag } from "./Icons";

export default function Navigation() {
  const count = useCart((s) => s.lines.reduce((n, l) => n + l.quantity, 0));
  const { audio, toggleAudio, openBag } = useUI();
  return (
    <>
      <div className="announcement">
        <span>YOUR WORLD. YOUR WARDROBE. YOUR RULES.</span>
        <span className="announcement-edition">INDEPENDENT BY DESIGN ↗</span>
      </div>
      <header className="navigation">
        <Link href="/" className="wordmark" aria-label="Hustler Dior home">
          <span className="nav-monogram" aria-hidden="true">
            HD
          </span>
          <span className="nav-brand">
            HUSTLER
            <br />
            DIOR
          </span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/#collection">SHOP ALL</Link>
          <Link href="/collections/mens-streetwear">MEN</Link>
          <Link href="/collections/womens-streetwear">WOMEN</Link>
          <Link href="/collections/hoodies-layers">LAYERS</Link>
          <Link href="/curated">EXTENDED EDIT</Link>
          <Link href="/#editorial">THE CULTURE</Link>
        </nav>
        <div className="nav-actions">
          <button
            type="button"
            className="audio-toggle"
            role="switch"
            aria-checked={audio}
            aria-label="Interface sound"
            onClick={() => {
              toggleAudio();
              sound(!audio);
            }}
          >
            <AudioIcon enabled={audio} />
            <span>SOUND {audio ? "ON" : "OFF"}</span>
          </button>
          <button
            type="button"
            className="bag-button"
            onClick={() => {
              openBag(true);
              sound(audio);
            }}
            aria-label={`Open bag, ${count} items`}
          >
            <Bag />
            <span>BAG</span>
            <b>{String(count).padStart(2, "0")}</b>
          </button>
        </div>
      </header>
      <nav
        className="mobile-shop-nav"
        aria-label="Mobile collection navigation"
      >
        <Link href="/#collection">SHOP ALL</Link>
        <Link href="/collections/tees">TEES</Link>
        <Link href="/collections/mens-streetwear">MEN</Link>
        <Link href="/collections/womens-streetwear">WOMEN</Link>
        <Link href="/collections/hoodies-layers">LAYERS</Link>
        <Link href="/curated">EXTENDED EDIT</Link>
        <Link href="/#editorial">CULTURE</Link>
      </nav>
    </>
  );
}
