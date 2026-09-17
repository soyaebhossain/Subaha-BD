'use client';

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Category, SortOption } from "@/lib/types";

interface Props {
  categories: Category[];
}

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export default function ProductFilters({ categories }: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const [searchText, setSearchText] = useState(search.get("search") ?? "");
  const [category, setCategory] = useState(search.get("category") ?? "");
  const [deliveryTime, setDeliveryTime] = useState(
    search.get("delivery_time") ?? "",
  );
  const [sort, setSort] = useState<SortOption | "">(
    (search.get("sort") as SortOption) ?? "",
  );

  function applyFilters() {
    const params = new URLSearchParams();
    if (searchText) params.set("search", searchText);
    if (category) params.set("category", category);
    if (deliveryTime) params.set("delivery_time", deliveryTime);
    if (sort) params.set("sort", sort);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  }

  function clearFilters() {
    setSearchText("");
    setCategory("");
    setDeliveryTime("");
    setSort("");
    router.push("/products");
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="grid gap-3 md:grid-cols-4">
        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search products"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((cat) => (
            <option key={cat.slug} value={cat.slug}>
              {cat.name_en}
            </option>
          ))}
        </select>
        <select
          value={deliveryTime}
          onChange={(e) => setDeliveryTime(e.target.value)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Any delivery time</option>
          <option value="60">60 min</option>
          <option value="120">120 min</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Sort</option>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center justify-end gap-3 text-sm">
        <button
          type="button"
          onClick={clearFilters}
          className="rounded-full border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={applyFilters}
          className="rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
