'use client';

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { createOrder, requestJSON } from "@/lib/api";
import { CartQuoteResponse, Order, Zone, DeliveryTime } from "@/lib/types";
import { useCartStore, calculateSubtotal } from "@/store/cart.store";
import { useUserStore } from "@/store/user.store";
import Price from "./Price";

const inputClass = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 focus:border-emerald-500 focus:outline-none";

export default function CheckoutForm() {
  const cart = useCartStore();
  const token = useUserStore((state) => state.token);
  const userId = useUserStore((state) => state.user?.id);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [address, setAddress] = useState({ line1: "", area: "", city: "" });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [placed, setPlaced] = useState<Order | null>(null);
  const submitting = useRef(false);
  const cartRequest = {
    items: cart.items.map((item) => ({ product_id: item.productId, variant_id: item.variantId, qty: item.qty })),
    zone: cart.zone, delivery_time: cart.deliveryTime,
  };
  const [quotedCart, setQuotedCart] = useState("");
  const cartFingerprint = JSON.stringify(cartRequest);
  const validQuote = cart.quote && quotedCart === cartFingerprint;

  async function refreshQuote() {
    setBusy(true);
    setMessage("");
    try {
      const result = await requestJSON<CartQuoteResponse>("/api/v1/cart/quote", { method: "POST", body: cartFingerprint });
      cart.setQuote(result);
      setQuotedCart(cartFingerprint);
    } catch (error) {
      cart.setQuote(null);
      setMessage(error instanceof Error ? error.message : "Could not calculate totals.");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current || !validQuote) return;
    submitting.current = true;
    setBusy(true);
    setMessage("");
    try {
      const body = { ...cartRequest, customer, address, payment_method: "cod" };
      const fingerprint = JSON.stringify({ body, userId });
      // Persist only the hash and random key, never customer details or auth tokens.
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(fingerprint));
      const hash = Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
      const saved = sessionStorage.getItem("subaha-checkout");
      let pending: { hash: string; key: string } | null = null;
      try { pending = saved ? JSON.parse(saved) : null; } catch { /* regenerate malformed local state */ }
      const key = pending?.hash === hash ? pending.key : crypto.randomUUID();
      sessionStorage.setItem("subaha-checkout", JSON.stringify({ hash, key }));
      const order = await createOrder({ ...body, checkout_key: key }, token ?? undefined);
      setPlaced(order);
      cart.clear();
      sessionStorage.removeItem("subaha-checkout");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Order could not be placed. Please retry.");
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (placed) return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8">
      <p className="text-sm font-semibold text-emerald-700">ORDER CONFIRMED</p>
      <h2 className="mt-2 text-2xl font-bold">Thank you — order #{placed.id}</h2>
      <p className="mt-3">Pay <Price amount={placed.total} /> on delivery.</p>
      <div className="my-5 space-y-2">{placed.fulfillments?.map((shipment) => (
        <p key={shipment.id} className="rounded-xl bg-white p-3 text-sm">{shipment.seller_name} · {shipment.outlet_name} · {shipment.status}</p>
      ))}</div>
      <p className="mb-4 text-sm">Save your order number for support. Items from different outlets may arrive separately.</p>
      <Link href="/products" className="font-semibold text-emerald-800 underline">Continue shopping</Link>
    </div>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-3">
        <div><h2 className="text-xl font-bold">Delivery details</h2><p className="mt-1 text-sm text-slate-500">We match each item to an outlet with available stock in your delivery zone.</p></div>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          {(["name", "phone", "email"] as const).map((field) => (
            <label key={field} className="space-y-1 text-sm"><span>{field === "name" ? "Full name" : field === "phone" ? "Phone" : "Email (optional)"}</span>
              <input className={inputClass} required={field !== "email"} type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
                maxLength={field === "phone" ? 32 : 255} value={customer[field]} onChange={(e) => setCustomer({ ...customer, [field]: e.target.value })} />
            </label>
          ))}
          {(["line1", "area", "city"] as const).map((field) => (
            <label key={field} className="space-y-1 text-sm"><span>{field === "line1" ? "Street address" : field === "area" ? "Area" : "City"}</span>
              <input className={inputClass} required={field === "line1"} maxLength={field === "line1" ? 255 : 128} value={address[field]} onChange={(e) => setAddress({ ...address, [field]: e.target.value })} />
            </label>
          ))}
          <label className="space-y-1 text-sm"><span>Delivery zone</span><select className={inputClass} value={cart.zone} onChange={(e) => cart.setZone(e.target.value as Zone)}>
            <option value="dhaka">Dhaka</option><option value="outside">Outside Dhaka</option>
          </select></label>
          <label className="space-y-1 text-sm"><span>Delivery window</span><select className={inputClass} value={cart.deliveryTime} onChange={(e) => cart.setDeliveryTime(e.target.value as DeliveryTime)}>
            {cart.zone === "dhaka" && <option value="60">60 minutes</option>}<option value="120">120 minutes</option>
          </select></label>
        </fieldset>
        <div className="rounded-xl bg-slate-50 p-4 text-sm"><strong>Cash on delivery</strong><p className="mt-1 text-slate-600">Delivery is charged per outlet shipment. Review the calculated total before placing your order.</p></div>
        <button type="button" disabled={busy || !cart.items.length} onClick={refreshQuote} className="w-full rounded-full border border-emerald-600 px-5 py-3 font-semibold text-emerald-700 disabled:opacity-40">Calculate delivery & total</button>
        <button disabled={busy || !cart.items.length || !validQuote} className="w-full rounded-full bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-40">{busy ? "Processing…" : "Place cash-on-delivery order"}</button>
        <p role="status" className="text-sm text-amber-800">{message}</p>
      </form>
      <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-6 lg:col-span-2">
        <h3 className="text-lg font-bold">Your order</h3>
        {!cart.items.length && <p className="text-sm text-slate-500">Your cart is empty.</p>}
        {cart.items.map((item) => <div key={item.id} className="flex justify-between gap-3 text-sm"><span>{item.name}<small className="block text-slate-500">{item.variantLabel} · Qty {item.qty}</small></span><Price amount={item.price * item.qty} /></div>)}
        <div className="space-y-3 border-t pt-4 text-sm">
          <div className="flex justify-between"><span>Subtotal</span><Price amount={validQuote ? cart.quote!.subtotal : calculateSubtotal(cart.items)} /></div>
          <div className="flex justify-between"><span>Delivery {validQuote ? `(${cart.quote!.shipments} shipments)` : ""}</span>{validQuote ? <Price amount={cart.quote!.delivery_fee} /> : <span>Calculate above</span>}</div>
          <div className="flex justify-between text-lg font-bold"><span>Total</span>{validQuote ? <Price amount={cart.quote!.total} /> : <span>Pending</span>}</div>
        </div>
      </aside>
    </div>
  );
}
