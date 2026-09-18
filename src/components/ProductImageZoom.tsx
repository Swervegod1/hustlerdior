"use client";

import Image from "next/image";
import { useState, type PointerEvent } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";

export default function ProductImageZoom({
  src,
  name,
  label,
}: {
  src: string | null;
  name: string;
  label: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const reduced = useReducedMotion();
  const x = useMotionValue(50);
  const y = useMotionValue(50);
  const origin = useMotionTemplate`${x}% ${y}%`;
  function follow(event: PointerEvent<HTMLButtonElement>) {
    if (!zoomed || event.pointerType !== "mouse") return;
    const box = event.currentTarget.getBoundingClientRect();
    x.set(
      Math.max(
        0,
        Math.min(100, ((event.clientX - box.left) / box.width) * 100),
      ),
    );
    y.set(
      Math.max(
        0,
        Math.min(100, ((event.clientY - box.top) / box.height) * 100),
      ),
    );
  }
  return (
    <div className="option-image gallery-plate">
      {src ? (
        <button
          type="button"
          className={`image-inspector${zoomed ? " is-zoomed" : ""}`}
          aria-label={`${zoomed ? "Zoom out of" : "Zoom image:"} ${name}`}
          aria-pressed={zoomed}
          onClick={() => {
            x.set(50);
            y.set(50);
            setZoomed(!zoomed);
          }}
          onPointerMove={follow}
          onPointerLeave={() => {
            x.set(50);
            y.set(50);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape" && zoomed) {
              event.stopPropagation();
              setZoomed(false);
            }
          }}
        >
          <motion.span
            className="inspector-image"
            animate={{ scale: zoomed ? 1.85 : 1 }}
            style={{ transformOrigin: origin }}
            transition={{
              duration: reduced ? 0 : 0.35,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <Image
              src={src}
              alt={name}
              fill
              sizes="(max-width: 700px) 90vw, 600px"
            />
          </motion.span>
          <span className="zoom-instruction">
            {zoomed ? "− ZOOM OUT" : "+ INSPECT THE DETAILS"}
          </span>
        </button>
      ) : (
        <span className="image-unavailable">IMAGE COMING SOON</span>
      )}
      <span className="option-image-label">{label}</span>
    </div>
  );
}
