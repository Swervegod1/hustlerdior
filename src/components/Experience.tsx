"use client";
import { useEffect } from "react";
import { useCart } from "@/stores/cart";
export function Experience() {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return null;
}
