import Image from "next/image";
import Link from "next/link";
import Price from "./Price";
import { Product } from "@/lib/types";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const primaryImage = product.images?.[0]?.url;
  const basePrice = Number(product.base_price ?? 0);
  const variantPrice = Number(product.variants?.[0]?.extra_price ?? 0);
  const price = basePrice + variantPrice;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <div className="relative aspect-square w-full bg-gradient-to-br from-emerald-50 to-emerald-100">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.name_en}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-emerald-700">
            Fresh pick
          </div>
        )}
      </div>
      <div className="space-y-1 p-4">
        <div className="text-xs uppercase tracking-wide text-emerald-700">
          {product.category?.name_en ?? "Organic"}
        </div>
        <div className="text-sm font-semibold text-slate-900">
          {product.name_en}
        </div>
        <Price amount={price} className="text-base font-bold text-emerald-800" />
        <div className="text-xs text-slate-600">
          {product.variants?.[0]?.weight_label ?? "Standard pack"}
        </div>
      </div>
    </Link>
  );
}
