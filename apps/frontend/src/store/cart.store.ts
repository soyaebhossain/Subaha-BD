'use client';

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartQuoteResponse, DeliveryTime, Zone } from "@/lib/types";

export interface CartLine {
  id: string;
  productId: number;
  variantId?: number;
  name: string;
  variantLabel?: string;
  price: number;
  qty: number;
  image?: string;
}

interface CartState {
  items: CartLine[];
  zone: Zone;
  deliveryTime: DeliveryTime;
  quote?: CartQuoteResponse | null;
  addItem: (item: Omit<CartLine, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  setZone: (zone: Zone) => void;
  setDeliveryTime: (deliveryTime: DeliveryTime) => void;
  setQuote: (quote: CartQuoteResponse | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      zone: "dhaka",
      deliveryTime: "60",
      quote: null,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (line) =>
              line.productId === item.productId &&
              line.variantId === item.variantId,
          );

          if (existing) {
            return {
              ...state,
              items: state.items.map((line) =>
                line.id === existing.id
                  ? { ...line, qty: line.qty + item.qty }
                  : line,
              ),
            };
          }

          const id =
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : Math.random().toString(36).slice(2);

          return { ...state, items: [...state.items, { ...item, id }] };
        }),
      updateQty: (id, qty) =>
        set((state) => ({
          ...state,
          items: state.items
            .map((line) => (line.id === id ? { ...line, qty } : line))
            .filter((line) => line.qty > 0),
        })),
      removeItem: (id) =>
        set((state) => ({
          ...state,
          items: state.items.filter((line) => line.id !== id),
        })),
      clear: () => set({ items: [], quote: null }),
      setZone: (zone) => set({ zone }),
      setDeliveryTime: (deliveryTime) => set({ deliveryTime }),
      setQuote: (quote) => set({ quote }),
    }),
    {
      name: "subahbd-cart",
      partialize: (state) => ({
        items: state.items,
        zone: state.zone,
        deliveryTime: state.deliveryTime,
      }),
    },
  ),
);

export function calculateSubtotal(items: CartLine[]) {
  return items.reduce((sum, line) => sum + line.price * line.qty, 0);
}
