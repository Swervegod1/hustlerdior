"use client";

import Link from "next/link";
import { createElement } from "react";
import { useCart } from "@/components/CartProvider";

export default function BagLink() {
  const { count, hydrated } = useCart();
  const label = hydrated && count > 0 ? `Bag (${count})` : "Bag";
  return createElement(Link, { href: "/bag" }, label);
}
