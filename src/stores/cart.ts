"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";
import type { CartLine, Product, ProductVariant } from "@/lib/types";
import { safeImage } from "@/lib/normalize";

const persistedLine = z.object({
  productId: z.number().int().positive(),
  variantId: z.number().int().positive(),
  name: z.string().max(300),
  color: z.string().max(100),
  size: z.string().max(60),
  image: z.string().nullable(),
  priceCents: z.number().int().positive(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  quantity: z.number().int().min(1).max(20),
});
interface CartStore {
  lines: CartLine[];
  add: (product: Product, variant: ProductVariant) => boolean;
  quantity: (id: number, quantity: number) => void;
  remove: (id: number) => void;
  clear: () => void;
}
export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      lines: [],
      add(product, variant) {
        if (
          variant.stock !== "available" ||
          get().lines.some((l) => l.currency !== variant.currency)
        )
          return false;
        const existing = get().lines.find((l) => l.variantId === variant.id);
        if (existing && existing.quantity >= 20) return false;
        if (!existing && get().lines.length >= 30) return false;
        set((s) => ({
          lines: existing
            ? s.lines.map((l) =>
                l.variantId === variant.id
                  ? {
                      ...l,
                      quantity: l.quantity + 1,
                      priceCents: variant.priceCents,
                    }
                  : l,
              )
            : [
                ...s.lines,
                {
                  productId: product.id,
                  variantId: variant.id,
                  name: product.name,
                  color: variant.color,
                  size: variant.size,
                  image: variant.image || product.image,
                  priceCents: variant.priceCents,
                  currency: variant.currency,
                  quantity: 1,
                },
              ],
        }));
        return true;
      },
      quantity(id, quantity) {
        if (Number.isInteger(quantity) && quantity >= 1 && quantity <= 20)
          set((s) => ({
            lines: s.lines.map((l) =>
              l.variantId === id ? { ...l, quantity } : l,
            ),
          }));
      },
      remove(id) {
        set((s) => ({ lines: s.lines.filter((l) => l.variantId !== id) }));
      },
      clear() {
        set({ lines: [] });
      },
    }),
    {
      name: "hustler-dior-bag-v1",
      version: 1,
      skipHydration: true,
      partialize: (s) => ({ lines: s.lines }),
      merge(persisted, current) {
        const parsed = z
          .object({ lines: z.array(persistedLine).max(30) })
          .safeParse(persisted);
        const seen = new Set<number>();
        const lines = parsed.success
          ? parsed.data.lines
              .filter((l) => {
                if (
                  seen.has(l.variantId) ||
                  l.currency !== parsed.data.lines[0]?.currency
                )
                  return false;
                seen.add(l.variantId);
                return true;
              })
              .map((l) => ({ ...l, image: safeImage(l.image) }))
          : [];
        return { ...current, lines };
      },
    },
  ),
);

interface UIStore {
  bagOpen: boolean;
  audio: boolean;
  openBag: (open: boolean) => void;
  toggleAudio: () => void;
}
export const useUI = create<UIStore>((set) => ({
  bagOpen: false,
  audio: false,
  openBag: (bagOpen) => set({ bagOpen }),
  toggleAudio: () => set((s) => ({ audio: !s.audio })),
}));
