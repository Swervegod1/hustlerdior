"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  bagCount,
  mergeLine,
  readBag,
  writeBag,
  type BagLine,
} from "@/src/lib/cart";

type CartContextValue = {
  lines: BagLine[];
  count: number;
  hydrated: boolean;
  add: (line: BagLine) => boolean;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<BagLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLines(readBag());
    setHydrated(true);
    const onChange = () => setLines(readBag());
    window.addEventListener("hustler-bag-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("hustler-bag-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const persist = useCallback((next: BagLine[]) => {
    setLines(next);
    writeBag(next);
  }, []);

  const add = useCallback(
    (line: BagLine) => {
      const next = mergeLine(readBag(), line);
      persist(next);
      return next.some((entry) => entry.variantId === line.variantId);
    },
    [persist],
  );

  const setQuantity = useCallback(
    (variantId: string, quantity: number) => {
      if (!Number.isInteger(quantity) || quantity < 1) return;
      persist(
        readBag().map((line) =>
          line.variantId === variantId ? { ...line, quantity: Math.min(20, quantity) } : line,
        ),
      );
    },
    [persist],
  );

  const remove = useCallback(
    (variantId: string) => {
      persist(readBag().filter((line) => line.variantId !== variantId));
    },
    [persist],
  );

  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: bagCount(lines),
      hydrated,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, hydrated, add, setQuantity, remove, clear],
  );

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return context;
}
