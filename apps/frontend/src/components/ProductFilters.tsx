'use client';

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent } from "react";
import { Category } from "@/lib/types";
import Icon from "./Icon";

export default function ProductFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const search = useSearchParams();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = new URLSearchParams();
    for (const [key, value] of data.entries()) if (String(value).trim()) query.set(key, String(value).trim());
    router.push(`/products?${query}`);
  }
  return <form key={search.toString()} onSubmit={submit} className="filter-panel" aria-label="Filter products"><div className="filter-controls"><input aria-label="Search catalogue" name="search" defaultValue={search.get("search") || ""} placeholder="What are you looking for?" className="filter-field" maxLength={150} /><select aria-label="Product category" name="category" defaultValue={search.get("category") || ""} className="filter-field"><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.slug}>{category.name_en}</option>)}</select><select aria-label="Sort products" name="sort" defaultValue={search.get("sort") || "newest"} className="filter-field"><option value="newest">Newest arrivals</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select><button className="button-primary"><Icon name="filter" width={15} height={15} />Apply filters</button></div>{(search.get("search") || search.get("category")) && <div className="mt-3 flex items-center justify-between text-xs text-slate-500"><span>Showing your selected filters</span><button type="button" onClick={() => router.push("/products")} className="text-link">Clear filters <Icon name="close" width={13} height={13} /></button></div>}</form>;
}
