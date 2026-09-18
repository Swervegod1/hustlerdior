"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { z } from "zod";

const productId = z.string().regex(/^gid:\/\/shopify\/Product\/\d+$/);
const savedState = z.object({ ids: z.array(productId).max(200) });

interface SavedPieces {
  ids: string[];
  toggle: (id: string) => void;
}

export const useSavedPieces = create<SavedPieces>()(
  persist(
    (set) => ({
      ids: [],
      toggle(id) {
        if (!productId.safeParse(id).success) return;
        set((state) => ({
          ids: state.ids.includes(id)
            ? state.ids.filter((saved) => saved !== id)
            : [...state.ids, id].slice(-200),
        }));
      },
    }),
    {
      name: "hustler-dior-saved-pieces-v1",
      version: 1,
      skipHydration: true,
      partialize: (state) => ({ ids: state.ids }),
      merge(persisted, current) {
        const parsed = savedState.safeParse(persisted);
        return {
          ...current,
          ids: parsed.success ? [...new Set(parsed.data.ids)] : [],
        };
      },
    },
  ),
);
