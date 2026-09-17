'use client';

import { useState } from "react";
import { PAYMENT_METHODS } from "@/lib/constants";
import {
  confirmCOD,
  createOrder,
  initBkash,
  initNagad,
  initSSLCommerz,
  quoteCart,
} from "@/lib/api";
import { CartLineInput, DeliveryTime, PaymentMethod, Zone } from "@/lib/types";
import {
  calculateSubtotal,
  useCartStore,
} from "@/store/cart.store";
import Price from "./Price";

export default function CheckoutForm() {
  const items = useCartStore((state) => state.items);
  const zone = useCartStore((state) => state.zone);
  const deliveryTime = useCartStore((state) => state.deliveryTime);
  const setZone = useCartStore((state) => state.setZone);
  const setDeliveryTime = useCartStore((state) => state.setDeliveryTime);
  const quote = useCartStore((state) => state.quote);
  const setQuote = useCartStore((state) => state.setQuote);
  const clearCart = useCartStore((state) => state.clear);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("sslcommerz");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<string | null>(null);

  const subtotal = calculateSubtotal(items);

  const cartItemsPayload: CartLineInput[] = items.map((item) => ({
    product_id: item.productId,
    variant_id: item.variantId,
    qty: item.qty,
  }));

  async function handleQuote() {
    setMessage(null);
    const response = await quoteCart({
      items: cartItemsPayload,
      zone,
      delivery_time: deliveryTime,
    });
    setQuote(response);
    if (!response) {
      setMessage("Could not fetch cart quote. Please try again.");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setPaymentInfo(null);
    setIsSubmitting(true);

    const payload = {
      customer: { name: customerName, phone, email },
      address: { line1: addressLine, area, city, zone },
      items: cartItemsPayload,
      zone,
      delivery_time: deliveryTime,
      payment_method: paymentMethod,
    };

    const response = await createOrder(payload);

    if (!response?.id) {
      setMessage("Could not create order. Please review details and try again.");
      setIsSubmitting(false);
      return;
    }

    const orderId = response.id;

    if (paymentMethod === "cod") {
      await confirmCOD(orderId);
      setMessage("Order placed with Cash on Delivery.");
      clearCart();
      setIsSubmitting(false);
      return;
    }

    if (paymentMethod === "sslcommerz") {
      const init = await initSSLCommerz(orderId);
      if (init?.redirect_url) {
        setPaymentInfo("Redirecting to SSLCOMMERZ...");
        window.location.href = init.redirect_url;
        return;
      }
    }

    if (paymentMethod === "bkash") {
      const init = await initBkash(orderId);
      const redirect =
        init?.redirect_url ?? init?.bkashURL ?? init?.payment_id;
      if (redirect && typeof redirect === "string" && redirect.startsWith("http")) {
        setPaymentInfo("Redirecting to bKash...");
        window.location.href = redirect;
        return;
      }
    }

    if (paymentMethod === "nagad") {
      const init = await initNagad(orderId);
      if (init?.redirect_url) {
        setPaymentInfo("Redirecting to Nagad...");
        window.location.href = init.redirect_url;
        return;
      }
    }

    setMessage("Order created. Complete payment to confirm.");
    clearCart();
    setIsSubmitting(false);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-5">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Checkout</h2>
          <button
            type="button"
            onClick={handleQuote}
            className="text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline"
          >
            Refresh totals
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Full name</span>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Customer name"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Phone</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="01xxxxxxxxx"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Email (optional)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Address</span>
            <input
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              required
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="House/road"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Area</span>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="Area"
            />
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">City</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              placeholder="City"
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Zone</span>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as Zone)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="dhaka">Dhaka</option>
              <option value="outside">Outside</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Delivery time</span>
            <select
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value as DeliveryTime)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              <option value="60">60 min</option>
              <option value="120">120 min</option>
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="text-slate-700">Payment</span>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method.toUpperCase()}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className="w-full rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {isSubmitting ? "Processing..." : "Place order"}
        </button>

        {message && <p className="text-sm text-amber-700">{message}</p>}
        {paymentInfo && <p className="text-sm text-emerald-700">{paymentInfo}</p>}
      </form>

      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Order summary</h3>
          <span className="text-sm text-slate-600">{items.length} items</span>
        </div>
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="text-sm text-slate-600">
              Your cart is empty. Add items to get a quote.
            </div>
          )}
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-sm text-slate-800"
            >
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-slate-500">
                  Qty {item.qty} {item.variantLabel ? `• ${item.variantLabel}` : ""}
                </div>
              </div>
              <Price amount={item.price * item.qty} className="font-semibold" />
            </div>
          ))}
        </div>
        <div className="space-y-1 border-t border-slate-200 pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span>Subtotal</span>
            <Price amount={subtotal} />
          </div>
          <div className="flex items-center justify-between">
            <span>Delivery</span>
            <span>
              {quote ? (
                <Price amount={quote.delivery_fee} />
              ) : (
                "Quote pending"
              )}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Discount</span>
            <span>
              {quote ? (
                <Price amount={quote.discount} />
              ) : (
                "Quote pending"
              )}
            </span>
          </div>
          <div className="flex items-center justify-between text-base font-bold">
            <span>Total</span>
            <span>
              {quote ? (
                <Price amount={quote.total} />
              ) : (
                <Price amount={subtotal} />
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
