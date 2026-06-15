"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@/lib/cart-types";

type CartContextValue = {
  lines: CartLine[];
  totalItems: number;
  totalPrice: number;
  currency: string | null;
  add: (line: Omit<CartLine, "qty" | "id"> & { qty?: number }) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "ethos.cart.v1";

function makeLineId(itemId: string, variantIndex: number | null) {
  return variantIndex === null ? itemId : `${itemId}:${variantIndex}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setLines(parsed as CartLine[]);
      }
    } catch {
      // ignore corrupt cart
    }
    setHydrated(true);
  }, []);

  // Persist on every change after hydration.
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const add = useCallback(
    (input: Omit<CartLine, "qty" | "id"> & { qty?: number }) => {
      const id = makeLineId(input.itemId, input.variantIndex);
      const addQty = input.qty ?? 1;
      setLines((prev) => {
        const existing = prev.find((l) => l.id === id);
        if (existing) {
          return prev.map((l) =>
            l.id === id ? { ...l, qty: l.qty + addQty } : l,
          );
        }
        const newLine: CartLine = {
          id,
          itemId: input.itemId,
          variantIndex: input.variantIndex,
          name: input.name,
          variantLabel: input.variantLabel,
          unitPrice: input.unitPrice,
          currency: input.currency,
          qty: addQty,
        };
        return [...prev, newLine];
      });
    },
    [],
  );

  const inc = useCallback((id: string) => {
    setLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)),
    );
  }, []);

  const dec = useCallback((id: string) => {
    setLines((prev) =>
      prev
        .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = lines.reduce((sum, l) => sum + l.qty, 0);
    const totalPrice = lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const currency = lines[0]?.currency ?? null;
    return { lines, totalItems, totalPrice, currency, add, inc, dec, remove, clear };
  }, [lines, add, inc, dec, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}
