'use client';

import { useState } from "react";
import VariantSelector from "./VariantSelector";
import Price from "./Price";
import { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart.store";

interface Props {
  product: Product;
}

export default function ProductActions({ product }: Props) {
  const [variantId, setVariantId] = useState<number | undefined>(
    product.variants?.[0]?.id,
  );
  const [qty, setQty] = useState(1);
  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const basePrice = Number(product.base_price ?? 0);
  const variantPrice = Number(selectedVariant?.extra_price ?? 0);
  const price = basePrice + variantPrice;

  function addToCart() {
    addItem({
      productId: product.id,
      variantId,
      name: product.name_en,
      variantLabel: selectedVariant?.weight_label,
      price,
      qty,
      image: product.images?.[0]?.url,
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-600">Price</div>
        <Price amount={price} className="text-xl font-bold text-emerald-700" />
      </div>
      <VariantSelector
        variants={product.variants}
        value={variantId}
        onChange={(id) => setVariantId(id)}
      />
      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-700">Qty</label>
        <input
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Number(e.target.value))}
          className="w-20 rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={addToCart}
        className="w-full rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Add to cart
      </button>
    </div>
  );
}
