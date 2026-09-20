'use client';

import { useState } from "react";
import Link from "next/link";
import Icon from "./Icon";
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
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const selectedVariant = product.variants?.find((v) => v.id === variantId);
  const basePrice = Number(product.base_price ?? 0);
  const variantPrice = Number(selectedVariant?.extra_price ?? 0);
  const price = basePrice + variantPrice;

  function addToCart() {
    if (!Number.isInteger(qty) || qty < 1 || qty > 100) return;
    addItem({
      productId: product.id,
      variantId,
      name: product.name_en,
      variantLabel: selectedVariant?.weight_label,
      price,
      qty,
      image: product.images?.[0]?.url,
    });
    setAdded(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Price amount={price} className="text-3xl font-semibold tracking-tight text-emerald-700" />
        <span className="text-xs text-slate-500">{selectedVariant?.weight_label || "Per item"}</span>
      </div>
      <VariantSelector
        variants={product.variants}
        value={variantId}
        onChange={(id) => { setVariantId(id); setAdded(false); }}
      />
      <div className="flex items-center gap-3">
        <label htmlFor="product-quantity" className="text-xs text-slate-700">Quantity</label>
        <input
          id="product-quantity"
          type="number"
          min={1}
          max={100}
          value={qty}
          onChange={(e) => { setQty(Number(e.target.value)); setAdded(false); }}
          className="w-20 rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={addToCart}
        disabled={!Number.isInteger(qty) || qty < 1 || qty > 100 || (Boolean(product.variants?.length) && !variantId) || selectedVariant?.stock === 0}
        className="button-primary w-full"
      >
        <Icon name={added ? "check" : "bag"} width={18} height={18} />{selectedVariant?.stock === 0 ? "Currently unavailable" : added ? "Add another to your bag" : "Add to shopping bag"}
      </button>
      <div aria-live="polite">{added && <p className="flex items-center justify-between text-xs text-emerald-700"><span>Added to your shopping bag.</span><Link href="/cart" className="text-link">View bag <Icon name="arrow" /></Link></p>}</div>
    </div>
  );
}
