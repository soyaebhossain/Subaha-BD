'use client';
import Image from "next/image";
import { useState } from "react";
import { ProductImage } from "@/lib/types";
import Icon from "./Icon";
import DemoProductArt from "./DemoProductArt";

export default function ProductGallery({ images, name, demo, category, pack }: { images: ProductImage[]; name: string; demo?: boolean; category?: string; pack?: string }) {
  const [selected, setSelected] = useState(0);
  const usable = images.filter((image) => image.url);
  return <div><div className="relative grid aspect-square place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-[#e9ecf3]">{usable[selected] ? <Image src={usable[selected].url} alt={name} fill priority sizes="(max-width:760px) 95vw, 580px" className="object-cover" /> : demo ? <DemoProductArt name={name} category={category} pack={pack} /> : <span className="product-no-image"><Icon name="box" width={60} height={60} /><span>Product photo coming soon</span></span>}</div>{usable.length > 1 && <div className="mt-4 flex gap-3 overflow-auto">{usable.map((image, index) => <button key={image.id ?? index} aria-label={`View product image ${index + 1}`} aria-pressed={selected === index} onClick={() => setSelected(index)} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${selected === index ? "border-emerald-700" : "border-transparent"}`}><Image src={image.url} alt="" fill sizes="80px" className="object-cover" /></button>)}</div>}</div>;
}
