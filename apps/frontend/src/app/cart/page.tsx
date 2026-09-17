'use client';

import Link from "next/link";
import Price from "@/components/Price";
import {
  calculateSubtotal,
  useCartStore,
} from "@/store/cart.store";

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const updateQty = useCartStore((state) => state.updateQty);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);

  const subtotal = calculateSubtotal(items);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cart</h1>
          <p className="text-sm text-slate-600">
            Review your cart before checkout.
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
          >
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
          Your cart is empty.{" "}
          <Link href="/products" className="font-semibold text-emerald-700">
            Browse products
          </Link>
          .
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {item.name}
              </div>
              <div className="text-xs text-slate-500">
                {item.variantLabel ?? "Standard"} • BDT {item.price}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={item.qty}
                onChange={(e) => updateQty(item.id, Number(e.target.value))}
                className="w-20 rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              />
              <Price amount={item.price * item.qty} className="font-semibold" />
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                className="text-xs font-semibold text-rose-600"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm shadow-sm">
          <div className="space-y-1">
            <div className="text-xs uppercase tracking-wide text-emerald-700">
              Subtotal
            </div>
            <Price amount={subtotal} className="text-lg font-bold" />
          </div>
          <Link
            href="/checkout"
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Go to checkout
          </Link>
        </div>
      )}
    </div>
  );
}
