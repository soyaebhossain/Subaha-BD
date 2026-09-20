'use client';

import { ProductVariant } from "@/lib/types";

interface Props {
  variants?: ProductVariant[];
  value?: number | undefined;
  onChange?: (variantId?: number) => void;
}

export default function VariantSelector({ variants, value, onChange }: Props) {
  if (!variants || variants.length === 0) {
    return (
      <div className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-700">
        Standard pack
      </div>
    );
  }

  return (
    <select
      aria-label="Product option"
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value ? Number(e.target.value) : undefined)}
      className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
    >
      <option value="">Select variant</option>
      {variants.map((variant) => (
        <option key={variant.id ?? variant.weight_label} value={variant.id}>
          {variant.weight_label ?? "Pack"}{" "}
          {Number(variant.extra_price) > 0
            ? `+${variant.extra_price}`
            : ""}
          {typeof variant.stock === "number" ? ` — Stock ${variant.stock}` : ""}
        </option>
      ))}
    </select>
  );
}
