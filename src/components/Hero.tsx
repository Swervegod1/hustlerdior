"use client";
import Image from "next/image";
import Link from "next/link";
import { Arrow } from "./Icons";
import type { Product } from "@/lib/types";
import { money, shortName } from "@/lib/format";
import Arrival from "./Arrival";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import type { PointerEvent } from "react";

export default function Hero({
  feature,
  secondary,
}: {
  feature?: Product;
  secondary?: Product;
}) {
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 80, damping: 22 });
  const rotateY = useSpring(ry, { stiffness: 80, damping: 22 });
  function follow(e: PointerEvent<HTMLDivElement>) {
    if (reduced || e.pointerType !== "mouse") return;
    const box = e.currentTarget.getBoundingClientRect();
    rx.set((0.5 - (e.clientY - box.top) / box.height) * 5);
    ry.set(((e.clientX - box.left) / box.width - 0.5) * 7);
  }
  return (
    <section className="hero hero-remix" aria-labelledby="hero-heading">
      <Arrival />
      <div className="campaign-masthead" aria-hidden="true">
        <span>HUSTLERDIOR</span>
        <span className="masthead-star">✳</span>
      </div>
      <div className="hero-topline">
        <span>INDEPENDENT STREETWEAR / THE CONCRETE EDIT</span>
        <span>CREATIVE DIRECTION — SWERVE GOD</span>
      </div>
      <div className="campaign-grid">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="edition-dot" /> ORIGINALS / VOL. 01
          </p>
          <h1 id="hero-heading">
            WEAR YOUR
            <br />
            <span>OWN RULES.</span>
          </h1>
          <p className="campaign-script" aria-hidden="true">
            Out of the ordinary.
          </p>
          <p className="hero-description">
            Graphic-heavy streetwear. Unfiltered expression.
            <br />
            For the ones building a world of their own.
          </p>
          <div className="hero-cta-row">
            <a className="primary-button" href="#collection">
              SHOP THE COLLECTION <Arrow />
            </a>
            <Link className="campaign-secondary" href="/about">
              THE STORY ↗
            </Link>
          </div>
          <div className="hero-footnote">
            <span>DESIGNED TO STAND OUT.</span>
            <span>MADE TO ORDER.</span>
          </div>
        </div>
        <motion.div
          className="campaign-board"
          style={{ rotateX, rotateY, transformPerspective: 1100 }}
          onPointerMove={follow}
          onPointerLeave={() => {
            rx.set(0);
            ry.set(0);
          }}
        >
          <span className="campaign-halo" aria-hidden="true" />
          <span className="board-marker" aria-hidden="true">
            THE
            <br />
            DAILY
            <br />
            UNIFORM.
          </span>
          {feature?.image ? (
            <Link
              className="campaign-product"
              href={`/products/${feature.slug}`}
              aria-label={`Explore ${feature.name}`}
            >
              <div className="campaign-product-image">
                <Image
                  src={feature.image}
                  alt={feature.name}
                  fill
                  sizes="(max-width: 700px) 85vw, 43vw"
                  preload
                />
              </div>
              <div className="campaign-product-label">
                <span>{shortName(feature.name)}</span>
                <b>
                  {feature.priceCents !== feature.maxPriceCents ? "From " : ""}
                  {money(feature.priceCents, feature.currency)}{" "}
                  <Arrow width="16" height="16" />
                </b>
              </div>
            </Link>
          ) : (
            <div className="campaign-type-art" aria-hidden="true">
              HD
              <br />
              <span>EXPRESS YOURSELF.</span>
            </div>
          )}
          {secondary?.image && secondary.id !== feature?.id && (
            <Link
              className="campaign-contact-sheet"
              href={`/products/${secondary.slug}`}
              aria-label={`Explore ${secondary.name}`}
            >
              <div>
                <Image
                  src={secondary.image}
                  alt={secondary.name}
                  fill
                  sizes="(max-width: 700px) 30vw, 160px"
                />
              </div>
              <span>BUILD YOUR ROTATION ↗</span>
            </Link>
          )}
          <span className="campaign-sticker" aria-hidden="true">
            HD
            <br />
            <small>
              ON YOUR
              <br />
              OWN TERMS.
            </small>
          </span>
          <span className="board-caption">001 / YOUR NEXT SIGNATURE PIECE</span>
        </motion.div>
      </div>
      <div className="campaign-bottom">
        <span>HUSTLE IS AN ART FORM.</span>
        <button
          type="button"
          className="replay-arrival"
          onClick={() => window.dispatchEvent(new Event("hd:arrival"))}
        >
          REPLAY THE TEE ARRIVAL ↺
        </button>
        <a href="#collection" aria-label="Scroll to the collection">
          SCROLL TO EXPLORE ↓
        </a>
      </div>
    </section>
  );
}
