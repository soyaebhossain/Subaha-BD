'use client';

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Page, requestJSON } from "@/lib/api";
import { useUserStore } from "@/store/user.store";
import Price from "@/components/Price";
import Dialog from "@/components/Dialog";

type Outlet = { id: number; name: string; code: string; seller_name: string; seller_kind: string; city: string; is_active: boolean };
type Stock = { id: number; outlet_name: string; product_name: string; variant_label: string; available: number };
type Fulfillment = { id: number; order: number; outlet_name: string; seller_name: string; status: string; subtotal: number; commission: number;
  customer_name: string; phone: string; address: string; area: string; city: string; items: { product_name: string; qty: number }[] };
type Overview = { outlets: number; active_outlets: number; fulfillments: number; merchandise: number; low_stock: number; accrued_net: number; can_write: boolean; by_status: { status: string; count: number }[] };
type CursorPage<T> = { results: T[]; next: string | null; previous: string | null };
const transitions: Record<string, string[]> = { CONFIRMED: ["PREPARING", "CANCELLED"], PREPARING: ["OUT_FOR_DELIVERY", "CANCELLED"], OUT_FOR_DELIVERY: ["DELIVERED"] };
const label = (value: string) => value.replaceAll("_", " ").toLowerCase();
const fieldClass = "rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm";

export default function OperationsPage() {
  const token = useUserStore((state) => state.token);
  const [tab, setTab] = useState<"orders" | "inventory" | "outlets">("orders");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [outlets, setOutlets] = useState<Page<Outlet> | null>(null);
  const [inventory, setInventory] = useState<Page<Stock> | null>(null);
  const [orders, setOrders] = useState<CursorPage<Fulfillment> | null>(null);
  const [outlet, setOutlet] = useState("");
  const [status, setStatus] = useState("");
  const [cursorQuery, setCursorQuery] = useState("");
  const [stockPage, setStockPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [adjusting, setAdjusting] = useState<Stock | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [adjustmentKey, setAdjustmentKey] = useState("");
  const [confirmation, setConfirmation] = useState<{ id: number; target: string } | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;
    const filters = new URLSearchParams({ ...(outlet ? { outlet } : {}), ...(status ? { status } : {}) });
    Promise.all([
      requestJSON<Overview>("/api/v1/operations/overview", { token }),
      requestJSON<Page<Outlet>>("/api/v1/operations/outlets/?page_size=100", { token }),
      requestJSON<Page<Stock>>(`/api/v1/operations/inventory/?page=${stockPage}&outlet=${outlet}`, { token }),
      requestJSON<CursorPage<Fulfillment>>(`/api/v1/operations/fulfillments/${cursorQuery || `?${filters}`}`, { token }),
    ]).then(([summary, branches, stock, fulfillment]) => {
      if (!active) return;
      setOverview(summary); setOutlets(branches); setInventory(stock); setOrders(fulfillment); setError("");
    }).catch((e: Error) => { if (active) { setError(e.message); setOverview(null); setOrders(null); setInventory(null); setOutlets(null); } });
    return () => { active = false; };
  }, [token, outlet, status, cursorQuery, stockPage, revision]);

  async function updateStatus() {
    if (!confirmation || !token) return;
    setBusy(true);
    try {
      await requestJSON(`/api/v1/operations/fulfillments/${confirmation.id}/transition/`, { token, method: "POST", body: JSON.stringify({ status: confirmation.target }) });
      setConfirmation(null); setRevision((value) => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Update failed."); }
    finally { setBusy(false); }
  }

  async function adjustStock(event: FormEvent) {
    event.preventDefault();
    if (!adjusting || !token) return;
    setBusy(true);
    try {
      await requestJSON(`/api/v1/operations/inventory/${adjusting.id}/adjust/`, { token, method: "POST", body: JSON.stringify({ delta: Number(delta), reason, operation_key: adjustmentKey }) });
      setAdjusting(null); setDelta(""); setReason(""); setRevision((value) => value + 1);
    } catch (e) { setError(e instanceof Error ? e.message : "Stock update failed."); }
    finally { setBusy(false); }
  }

  if (!token) return <div className="rounded-2xl border bg-white p-10"><h1 className="text-2xl font-bold">Outlet operations</h1><p className="my-4 text-slate-600">Sign in with your seller or outlet team account to manage fulfillment and stock.</p><Link href="/account" className="font-semibold text-emerald-700 underline">Sign in →</Link></div>;

  return <div className="space-y-6">
    <div className="ops-banner flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-widest text-emerald-700">SUBAHA BD / OPERATIONS</p><h1 className="mt-2 text-3xl font-bold">Outlet control centre</h1><p className="mt-2 text-sm text-slate-500">Your outlets, fulfillment queue and inventory in one place.</p></div><button onClick={() => setRevision(revision + 1)} className={fieldClass}>Refresh</button></div>
    {error && <p role="alert" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">{error} Access requires an active seller membership or platform administrator account.</p>}
    {!overview && !error && <p role="status">Loading operations…</p>}
    {overview && <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{ name: "Active outlets", value: `${overview.active_outlets} / ${overview.outlets}`, hint: "Across your sellers" },
          { name: "Fulfillments", value: overview.fulfillments, hint: "Created in the last 24 hours" },
          { name: "Low-stock items", value: overview.low_stock, hint: "5 or fewer units available" },
          { name: "Delivered seller accrual", value: <Price amount={overview.accrued_net} />, hint: "Last 24h · before payout reconciliation" }].map((metric) => <div key={metric.name} className="ops-metric"><p className="text-sm text-slate-500">{metric.name}</p><p className="my-3 text-3xl font-bold">{metric.value}</p><p className="text-xs text-slate-500">{metric.hint}</p></div>)}
      </div>
      <div className="flex flex-wrap gap-2">{overview.by_status.map((item) => <span key={item.status} className="rounded-full bg-slate-100 px-3 py-1 text-xs capitalize">{label(item.status)} · {item.count}</span>)}</div>
      <div className="ops-tabs flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">{(["orders", "inventory", "outlets"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${tab === item ? "bg-emerald-700 text-white" : "bg-white text-slate-600"}`}>{item}</button>)}</div>
        <div className="flex flex-wrap gap-2"><select aria-label="Filter by outlet" className={fieldClass} value={outlet} onChange={(e) => { setOutlet(e.target.value); setCursorQuery(""); setStockPage(1); }}><option value="">All outlets</option>{outlets?.results.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select>
          {tab === "orders" && <select aria-label="Filter by status" className={fieldClass} value={status} onChange={(e) => { setStatus(e.target.value); setCursorQuery(""); }}><option value="">All statuses</option>{["CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"].map((value) => <option key={value} value={value}>{label(value)}</option>)}</select>}
        </div>
      </div>
      {tab === "orders" && <div className="space-y-4">
        {orders?.results.map((order) => <article key={order.id} className="rounded-2xl border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-bold">Order #{order.order} <span className="font-normal text-slate-500">/ shipment #{order.id}</span></h2><p className="mt-1 text-xs text-slate-500">{order.seller_name} · {order.outlet_name}</p></div><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold capitalize text-emerald-800">{label(order.status)}</span></div>
          <div className="my-4 grid gap-4 text-sm sm:grid-cols-2"><div><p className="font-medium">{order.customer_name} · {order.phone}</p><p className="mt-1 text-slate-500">{[order.address, order.area, order.city].filter(Boolean).join(", ")}</p></div><div>{order.items.map((item, index) => <p key={index}>{item.qty} × {item.product_name}</p>)}</div></div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><p className="text-sm">Merchandise <Price amount={order.subtotal} /> <span className="ml-3 text-slate-500">Commission <Price amount={order.commission} /></span></p><div className="flex gap-2">{overview.can_write && transitions[order.status]?.map((target) => <button key={target} disabled={busy} className={`${fieldClass} capitalize`} onClick={() => { setError(""); setConfirmation({ id: order.id, target }); }}>{label(target)}</button>)}</div></div>
        </article>)}
        {!orders?.results.length && <p className="rounded-2xl border border-dashed p-8 text-center text-slate-500">No fulfillments match these filters.</p>}
        <div className="flex justify-between"><button disabled={!orders?.previous} onClick={() => setCursorQuery(new URL(orders!.previous!).search)}>← Previous</button><button disabled={!orders?.next} onClick={() => setCursorQuery(new URL(orders!.next!).search)}>Next →</button></div>
      </div>}
      {tab === "inventory" && <div className="overflow-x-auto rounded-2xl border bg-white">
        <table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr>{["Product", "Outlet", "Available", ""].map((heading, index) => <th key={index} className="p-4">{heading}</th>)}</tr></thead><tbody>{inventory?.results.map((row) => <tr key={row.id} className="border-t"><td className="p-4 font-medium">{row.product_name}<small className="block text-slate-500">{row.variant_label}</small></td><td className="p-4">{row.outlet_name}</td><td className={`p-4 font-bold ${row.available <= 5 ? "text-amber-700" : "text-emerald-700"}`}>{row.available}</td><td className="p-4">{overview.can_write && <button className="font-semibold text-emerald-700" onClick={() => { setError(""); setAdjusting(row); setAdjustmentKey(crypto.randomUUID()); setDelta(""); setReason(""); }}>Adjust stock</button>}</td></tr>)}</tbody></table>
        {!inventory?.results.length && <p className="p-8 text-center text-slate-500">No inventory rows. A platform administrator can provision product and outlet stock records.</p>}
        <div className="flex justify-between border-t p-4 text-sm"><button disabled={stockPage === 1} onClick={() => setStockPage(stockPage - 1)}>← Previous</button><span>Page {stockPage}</span><button disabled={!inventory?.next} onClick={() => setStockPage(stockPage + 1)}>Next →</button></div>
      </div>}
      {tab === "outlets" && <div className="grid gap-4 md:grid-cols-3">{outlets?.results.map((branch) => <div key={branch.id} className="rounded-2xl border bg-white p-5"><p className="text-xs font-bold uppercase text-emerald-700">{branch.code}</p><h2 className="mt-2 text-lg font-bold">{branch.name}</h2><p className="mt-1 text-sm text-slate-500">{branch.seller_name} · {branch.seller_kind}</p><p className="mt-4 text-sm">{branch.city} · {branch.is_active ? "Active" : "Inactive"}</p></div>)}</div>}
    </>}
    {confirmation && <Dialog labelledBy="transition-title" onClose={() => setConfirmation(null)} busy={busy}><div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 id="transition-title" className="text-lg font-bold">Update shipment #{confirmation.id}?</h2><p className="text-sm">Set status to {label(confirmation.target)}.{confirmation.target === "CANCELLED" ? " Allocated stock will be returned and the COD total reduced." : ""}</p><div className="flex gap-3"><button disabled={busy} onClick={updateStatus} className="rounded-full bg-emerald-700 px-4 py-2 text-white">Confirm</button><button disabled={busy} onClick={() => setConfirmation(null)}>Keep current status</button></div>{error && <p role="alert" className="text-xs text-amber-800">{error}</p>}</div></Dialog>}
    {adjusting && <Dialog labelledBy="stock-title" onClose={() => setAdjusting(null)} busy={busy}><form onSubmit={adjustStock} className="w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h2 id="stock-title" className="text-lg font-bold">Adjust {adjusting.product_name}</h2><p className="text-sm text-slate-500">{adjusting.outlet_name} · currently {adjusting.available} available</p><label className="block text-sm">Quantity change (+ add, − remove)<input required type="number" min="-1000000" max="1000000" step="1" value={delta} onChange={(e) => setDelta(e.target.value)} className={`${fieldClass} mt-1 w-full`} /></label><label className="block text-sm">Reason<input required maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} className={`${fieldClass} mt-1 w-full`} placeholder="Delivery received, stock count correction…" /></label><div className="flex gap-3"><button disabled={busy || !Number(delta)} className="rounded-full bg-emerald-700 px-4 py-2 text-white disabled:opacity-40">Save adjustment</button><button type="button" disabled={busy} onClick={() => setAdjusting(null)}>Cancel</button></div>{error && <p role="alert" className="text-xs text-amber-800">{error}</p>}</form></Dialog>}
  </div>;
}
