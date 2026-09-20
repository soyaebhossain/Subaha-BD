import Link from "next/link";
import { notFound } from "next/navigation";
import ProductActions from "@/components/ProductActions";
import ProductGallery from "@/components/ProductGallery";
import Icon from "@/components/Icon";
import { getProduct } from "@/lib/api";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <><div className="breadcrumb"><Link href="/">Home</Link><Icon name="chevron" /><Link href="/products">Marketplace</Link><Icon name="chevron" /><span className="truncate">{product.name_en}</span></div><div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-14"><ProductGallery images={product.images || []} name={product.name_en} demo={product.is_demo} category={product.category?.name_en} pack={product.variants?.[0]?.weight_label} /><div className="py-2"><p className="eyebrow">{product.category?.name_en || "Everyday discoveries"}</p><h1 className="page-heading mt-5">{product.name_en}</h1>{product.seller_name && <p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><Icon name="store" width={15} height={15} />From {product.seller_name}</p>}{product.is_demo && <p className="demo-notice mt-5">Demo product. Prices, stock and packaging are sample values.</p>}<div className="my-7"><ProductActions product={product} /></div><div className="grid grid-cols-2 gap-4 border-y border-slate-200 py-5 text-xs text-slate-600"><span className="flex items-center gap-2"><Icon name="shield" width={18} height={18} />Cash on delivery</span><span className="flex items-center gap-2"><Icon name="truck" width={18} height={18} />Outlet-based delivery</span></div><section className="mt-7"><h2 className="text-sm font-semibold">A little more about this find</h2><p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-slate-500">{product.desc_en || "Product details are being prepared. Select an available option and review the final price and delivery at checkout."}</p></section><Link href="/return-policy" className="text-link mt-6">Returns & support <Icon name="arrow" /></Link></div></div></>;
}
