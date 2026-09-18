"use client";
import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { useReducedMotion } from "framer-motion";
import { useCart, useUI } from "@/stores/cart";

export function Experience() {
  const reduce = useReducedMotion();
  const ring = useRef<HTMLDivElement>(null);
  const bagOpen = useUI((s) => s.bagOpen);
  const lenis = useRef<Lenis | null>(null);
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (reduce || !matchMedia("(pointer:fine)").matches) return;
    lenis.current = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      anchors: true,
      autoRaf: true,
    });
    return () => {
      lenis.current?.destroy();
      lenis.current = null;
    };
  }, [reduce]);
  useEffect(() => {
    if (bagOpen) lenis.current?.stop();
    else lenis.current?.start();
  }, [bagOpen]);
  useEffect(() => {
    if (reduce || !matchMedia("(pointer:fine)").matches) return;
    const cursor = ring.current;
    let x = -100,
      y = -100,
      targetX = -100,
      targetY = -100,
      frame = 0;
    const move = (event: PointerEvent) => {
      const target = (event.target as HTMLElement).closest(
        "button, a, [data-magnetic]",
      );
      const box = target?.getBoundingClientRect();
      targetX = box
        ? event.clientX * 0.5 + (box.x + box.width / 2) * 0.5
        : event.clientX;
      targetY = box
        ? event.clientY * 0.5 + (box.y + box.height / 2) * 0.5
        : event.clientY;
      cursor?.classList.toggle("cursor-active", !!target);
    };
    const animate = () => {
      x += (targetX - x) * 0.2;
      y += (targetY - y) * 0.2;
      if (cursor)
        cursor.style.transform = `translate3d(${x - 16}px,${y - 16}px,0)`;
      frame = requestAnimationFrame(animate);
    };
    window.addEventListener("pointermove", move, { passive: true });
    frame = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(frame);
    };
  }, [reduce]);
  return <div ref={ring} className="magnetic-cursor" aria-hidden="true" />;
}
