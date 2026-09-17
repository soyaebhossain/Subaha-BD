import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { getCategories, getProducts } from "@/lib/api";
import { Category, Product } from "@/lib/types";

const fallbackProducts: Product[] = [
  {
    id: 101,
    name_en: "Mango (organic)",
    slug: "organic-mango",
    base_price: 320,
    variants: [{ id: 1011, weight_label: "1kg", extra_price: 0 }],
    images: [{ url: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc" }],
  },
  {
    id: 102,
    name_en: "Free-range eggs",
    slug: "free-range-eggs",
    base_price: 180,
    variants: [{ id: 1021, weight_label: "12 pcs", extra_price: 0 }],
    images: [{ url: "https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38" }],
  },
];

const fallbackCategories: Category[] = [
  { id: 1, name_en: "Vegetables", slug: "vegetables" },
  { id: 2, name_en: "Fruits", slug: "fruits" },
  { id: 3, name_en: "Pantry", slug: "pantry" },
];

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProductsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const params = Object.fromEntries(
    Object.entries(resolvedSearchParams)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(([, value]) => Boolean(value)),
  );

  const [products, categories] = await Promise.all([
    getProducts(params),
    getCategories(),
  ]);
  const list = products ?? fallbackProducts;
  const categoryOptions = categories ?? fallbackCategories;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-sm text-slate-600">
            Search, filter by category, delivery time, or sort by price.
          </p>
        </div>
        <Link
          href="/cart"
          className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
        >
          View cart
        </Link>
      </div>

      <ProductFilters categories={categoryOptions} />

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
        {list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">
            No products found for the applied filters.
          </div>
        )}
      </div>
    </div>
  );
}
