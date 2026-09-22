import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import Icon from "@/components/Icon";
import { getCategories, getProductPage } from "@/lib/api";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const params: Record<string, string> = {};
  for (const [key, value] of Object.entries(query)) if (value) params[key] = Array.isArray(value) ? value[0] : value;
  delete params.sort;
  const [products, categories] = await Promise.all([getProductPage(params), getCategories()]);
  const page = Math.max(1, Number(params.page) || 1);
  const pageLink = (value: number) => `/products?${new URLSearchParams({ ...params, page: String(value) })}`;
  return <><div className="breadcrumb"><Link href="/">Home</Link><Icon name="chevron" /><span>Marketplace</span></div><div className="catalog-top"><div><p className="eyebrow">Your everyday discoveries</p><h1 className="page-heading mt-3">Find a little of everything.</h1><p className="page-intro">Browse good finds from our outlets and partner sellers.</p></div><span className="section-kicker">{products?.count ?? 0} products to explore</span></div>{products?.results.some(p => p.is_demo) && <p className="demo-notice mb-5">Explore our demo catalogue. Sample prices, stock and illustrations will be replaced with verified product information before launch.</p>}<ProductFilters key={new URLSearchParams(params).toString()} categories={categories || []} priceRange={products?.price_range} />
    {products?.results.length ? <div className="product-grid">{products.results.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><span className="empty-icon"><Icon name={products ? "search" : "box"} /></span><h2>{products ? "No finds here just yet." : "The shelves are taking a moment."}</h2><p>{products ? "Try a different search or clear your filters to explore the rest of the marketplace." : "We couldn’t load the catalogue. Please refresh in a moment."}</p><Link href="/products" className="button-secondary">{products ? "Browse all products" : "Try again"}<Icon name="arrow" width={15} height={15} /></Link></div>}
    {(products?.count || 0) > 0 && <nav className="pagination-bar" aria-label="Product pages">{products?.previous ? <Link href={pageLink(page - 1)}>← Previous</Link> : <span />}<span>Page {page} · {products?.count} products</span>{products?.next ? <Link href={pageLink(page + 1)}>Next →</Link> : <span />}</nav>}
  </>;
}
