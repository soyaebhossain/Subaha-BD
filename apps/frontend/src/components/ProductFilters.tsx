'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Category } from "@/lib/types";
import { PriceRange } from "@/lib/api";
import Icon from "./Icon";

function percent(value: string | null, fallback: number) {
  const n = Number(value);
  return value && Number.isInteger(n) && n >= 1 && n <= 100 ? n : fallback;
}
export default function ProductFilters({ categories, priceRange }: { categories: Category[]; priceRange?: PriceRange }) {
  const router = useRouter();
  const search = useSearchParams();
  const [from, setFrom] = useState(percent(search.get("price_from"), 1));
  const [to, setTo] = useState(Math.max(percent(search.get("price_from"), 1), percent(search.get("price_to"), 100)));
  const minimum = Number(priceRange?.minimum ?? 0), maximum = Number(priceRange?.maximum ?? 0);
  const available = priceRange?.minimum != null;
  const amount = (value: number, upper: boolean) => {
    const raw = (minimum + (maximum - minimum) * (value - 1) / 99) * 100;
    const rounded = (upper ? Math.ceil(raw - 1e-8) : Math.floor(raw + 1e-8)) / 100;
    return `BDT ${new Intl.NumberFormat("en-BD", { maximumFractionDigits: 2 }).format(rounded)}`;
  };
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const [key, value] of data.entries()) if (String(value).trim() && !(key === "price_from" && value === "1") && !(key === "price_to" && value === "100")) query.set(key, String(value).trim());
    router.push(query.size ? `/products?${query}` : "/products");
  }
  const filtered = search.get("search") || search.get("category") || search.get("price_from") || search.get("price_to");
  return <form onSubmit={submit} className="filter-panel" aria-label="Filter products"><div className="filter-controls"><input aria-label="Search catalogue" name="search" defaultValue={search.get("search") || ""} placeholder="What are you looking for?" className="filter-field" maxLength={150} /><select aria-label="Product category" name="category" defaultValue={search.get("category") || ""} className="filter-field"><option value="">All categories</option>{categories.map(category => <option key={category.id} value={category.slug}>{category.name_en}</option>)}</select>
    <fieldset className="price-range-filter"><legend>Price range <span>{from}% – {to}%</span></legend><div className="price-range-track" style={{ background: `linear-gradient(to right, #dce4f4 ${(from - 1) / 99 * 100}%, var(--brand) ${(from - 1) / 99 * 100}%, var(--brand) ${(to - 1) / 99 * 100}%, #dce4f4 ${(to - 1) / 99 * 100}%)` }}><input type="range" name="price_from" aria-label="Minimum price percentage" aria-valuetext={`${from} percent, ${amount(from, false)}`} min={1} max={100} step={1} value={from} onChange={e => setFrom(Math.min(Number(e.target.value), to))} disabled={!available} style={{ zIndex: from > 90 ? 3 : 1 }} /><input type="range" name="price_to" aria-label="Maximum price percentage" aria-valuetext={`${to} percent, ${amount(to, true)}`} min={1} max={100} step={1} value={to} onChange={e => setTo(Math.max(Number(e.target.value), from))} disabled={!available} /></div><div className="price-range-amounts" aria-live="polite"><span>{available ? amount(from, false) : "No matching prices"}</span><span>{available ? amount(to, true) : ""}</span></div></fieldset>
    <button className="button-primary"><Icon name="filter" width={15} height={15} />Apply filters</button></div><p className="price-range-help">1% is the lowest matching price; 100% is the highest. This is a price range, not a discount.</p>{filtered && <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Showing your selected filters</span><button type="button" onClick={() => router.push("/products")} className="text-link">Clear filters <Icon name="close" width={13} height={13} /></button></div>}</form>;
}
