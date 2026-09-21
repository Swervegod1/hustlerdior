"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { motion } from "framer-motion";

const SEEN_KEY = "hustler-dior-arrival-v2";

function SignatureTee() {
  const [failed, setFailed] = useState(false);
  if (failed) return <IllustratedTee />;
  return (
    <Image
      src="/brand/signature-tee-v2.webp"
      alt="Hustler Dior signature T-shirt brand concept"
      width={1050}
      height={1050}
      sizes="(max-width: 700px) 85vw, 560px"
      loading="eager"
      onError={() => setFailed(true)}
    />
  );
}

function IllustratedTee() {
  return (
    <svg
      viewBox="0 0 600 660"
      role="img"
      aria-label="Black T-shirt with HUSTLERDIOR across the chest"
    >
      <defs>
        <linearGradient id="tee-body" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#494b47" />
          <stop offset=".28" stopColor="#191c19" />
          <stop offset=".63" stopColor="#282b27" />
          <stop offset="1" stopColor="#10120f" />
        </linearGradient>
        <linearGradient id="tee-edge">
          <stop stopColor="#a7aea0" stopOpacity=".55" />
          <stop offset=".4" stopColor="#424940" stopOpacity=".15" />
          <stop offset="1" stopColor="#92998a" stopOpacity=".4" />
        </linearGradient>
        <radialGradient id="tee-light">
          <stop stopColor="#8b9880" stopOpacity=".24" />
          <stop offset="1" stopColor="#31382d" stopOpacity="0" />
        </radialGradient>
        <filter id="tee-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".78"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope=".065" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="screen" />
        </filter>
        <path
          id="tee-cut"
          d="M205 62 139 87 28 184 101 284 157 241 138 579 Q299 620 462 579 L444 241 501 284 572 184 461 87 396 62 Q364 95 300 97 Q236 95 205 62Z"
        />
        <clipPath id="tee-clip">
          <use href="#tee-cut" />
        </clipPath>
      </defs>
      <use
        href="#tee-cut"
        fill="url(#tee-body)"
        stroke="url(#tee-edge)"
        strokeWidth="3"
      />
      <g clipPath="url(#tee-clip)">
        <ellipse cx="293" cy="223" rx="225" ry="310" fill="url(#tee-light)" />
        <path
          d="M160 222Q188 368 171 575M445 221Q414 379 434 580M244 119Q267 213 248 266M352 130Q327 249 352 289M201 475Q310 510 417 468"
          fill="none"
          stroke="#808b76"
          strokeOpacity=".12"
          strokeWidth="8"
        />
        <rect
          width="600"
          height="660"
          fill="transparent"
          filter="url(#tee-grain)"
        />
        <text
          x="300"
          y="244"
          textAnchor="middle"
          fill="#eeeee6"
          fontFamily="Arial, sans-serif"
          fontSize="43"
          fontWeight="900"
          letterSpacing="-2.5"
        >
          HUSTLERDIOR
        </text>
        <text
          x="300"
          y="267"
          textAnchor="middle"
          fill="#d7e6cb"
          fontFamily="Arial, sans-serif"
          fontSize="8"
          letterSpacing="4.2"
        >
          INDEPENDENT BY DESIGN
        </text>
        <path
          d="M300 318 306 335 324 330 312 345 324 360 306 356 300 375 294 356 276 360 288 345 276 330 294 335Z"
          fill="#ff6254"
        />
        <path
          d="M144 567Q300 603 456 567M43 183 109 271M557 183 493 271"
          fill="none"
          stroke="#8e9687"
          strokeOpacity=".35"
          strokeWidth="2"
          strokeDasharray="3 4"
        />
        <rect x="405" y="554" width="22" height="27" fill="#ff6254" />
        <text
          x="416"
          y="572"
          textAnchor="middle"
          fill="#171b14"
          fontFamily="Arial"
          fontSize="9"
          fontWeight="900"
        >
          HD
        </text>
      </g>
      <path
        d="M205 62Q223 139 300 141Q377 139 396 62L383 63Q362 116 300 118Q238 116 218 63Z"
        fill="#0e100e"
        stroke="#6e7765"
        strokeOpacity=".5"
        strokeWidth="2"
      />
      <path
        d="M219 72Q239 125 300 127Q361 125 381 72"
        fill="none"
        stroke="#87937a"
        strokeOpacity=".25"
        strokeWidth="3"
      />
    </svg>
  );
}

export default function Arrival() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const replay = () => {
      if (!reduced.matches) setOpen(true);
    };
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "seen";
    } catch {}
    const frame = requestAnimationFrame(() => {
      if (!seen && !reduced.matches) setOpen(true);
    });
    const motionChange = () => {
      if (reduced.matches) setOpen(false);
    };
    window.addEventListener("hd:arrival", replay);
    reduced.addEventListener("change", motionChange);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("hd:arrival", replay);
      reduced.removeEventListener("change", motionChange);
    };
  }, []);
  function finish() {
    setOpen(false);
    try {
      sessionStorage.setItem(SEEN_KEY, "seen");
    } catch {}
  }
  // Only the opening brand moment is modal; normal shopping remains available immediately after it.
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(value) => {
        if (!value) finish();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="arrival-backdrop" />
        <Dialog.Content
          className="arrival-stage"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("main")?.focus({ preventScroll: true });
          }}
        >
          <Dialog.Title className="sr-only">
            Hustler Dior — the arrival
          </Dialog.Title>
          <Dialog.Description className="sr-only">
            A signature T-shirt flies forward and settles into the collection.
            Press Escape or Enter the collection to skip.
          </Dialog.Description>
          <span className="arrival-issue" aria-hidden="true">
            HUSTLER DIOR / THE ARRIVAL
          </span>
          <div className="arrival-beam" aria-hidden="true" />
          <motion.div
            className="arrival-ground-shadow"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{
              opacity: [0, 0.65, 0.4, 0],
              scale: [0.4, 1.15, 0.9, 0.6],
            }}
            transition={{ duration: 3.8, times: [0, 0.25, 0.55, 1] }}
          />
          <motion.div
            className="arrival-shirt"
            aria-hidden="true"
            initial={{
              scale: 0.08,
              y: -190,
              rotate: -25,
              rotateY: -65,
              opacity: 0,
            }}
            animate={{
              scale: [0.08, 1.24, 1, 0.72],
              y: [-190, -35, 15, 370],
              rotate: [-18, 4, -2, 0],
              rotateY: [-45, 9, -3, 0],
              opacity: [0, 1, 1, 0],
            }}
            transition={{
              duration: 3.8,
              times: [0, 0.24, 0.48, 1],
              ease: [0.2, 0.7, 0.18, 1],
            }}
            onAnimationComplete={finish}
          >
            <SignatureTee />
          </motion.div>
          <motion.div
            className="arrival-wordmark"
            aria-hidden="true"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, 30] }}
            transition={{ duration: 3.8, times: [0, 0.23, 0.74, 1] }}
          >
            <span>MAKE AN ENTRANCE.</span>
            <strong>HUSTLERDIOR</strong>
          </motion.div>
          <Dialog.Close className="arrival-enter">
            ENTER THE COLLECTION <span aria-hidden="true">↗</span>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
