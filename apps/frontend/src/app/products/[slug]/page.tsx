import Image from "next/image";
import { notFound } from "next/navigation";
import ProductActions from "@/components/ProductActions";
import Price from "@/components/Price";
import { getProduct } from "@/lib/api";
import { Product } from "@/lib/types";

const fallbackProduct: Product = {
  id: 999,
  name_en: "Organic bundle",
  slug: "organic-bundle",
  base_price: 990,
  desc_en: "Sample data. Connect backend to see live product details.",
  variants: [{ id: 9991, weight_label: "Starter pack", extra_price: 0 }],
  images: [{ url: "https://images.unsplash.com/photo-1504674900247-0877df9cc836" }],
};

interface Props {
  params: { slug: string };
}

export default async function ProductDetailPage({ params }: Props) {
  const product = (await getProduct(params.slug)) ?? fallbackProduct;

  if (!product) {
    notFound();
  }

  const image = product.images?.[0]?.url;

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="relative aspect-square bg-gradient-to-br from-emerald-50 to-emerald-100">
          {image ? (
            <Image
              src={image}
              alt={product.name_en}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-emerald-700">
              Fresh pick
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-emerald-700">
            Product detail
          </p>
          <h1 className="text-3xl font-bold text-slate-900">{product.name_en}</h1>
          <Price amount={product.base_price} className="text-xl font-semibold" />
        </div>
        <p className="text-sm text-slate-700">
          {product.desc_en ?? "Organic groceries sourced daily. Connect to API to load full description."}
        </p>

        <ProductActions product={product} />
      </div>
    </div>
  );
}
