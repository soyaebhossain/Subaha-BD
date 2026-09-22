import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/types";
import Icon from "./Icon";
import Price from "./Price";
import DemoProductArt from "./DemoProductArt";

export default function ProductCard({ product }: { product: Product }) {
  const primaryImage = product.images?.[0]?.url;
  const price = Number(product.base_price) + Number(product.variants?.[0]?.extra_price ?? 0);
  const reviews = product.review_count ?? 0;
  const rating = product.rating_average ?? 0;
  return <Link href={`/products/${product.slug}`} className="product-card"><div className="product-visual">{primaryImage ? <Image src={primaryImage} alt={product.name_en} fill sizes="(max-width:760px) 45vw, (max-width:1100px) 30vw, 280px" /> : product.is_demo ? <DemoProductArt name={product.name_en} category={product.category?.name_en} pack={product.variants?.[0]?.weight_label} /> : <span className="product-no-image"><Icon name="box" /><span>Photo coming soon</span></span>}</div><div className="product-info">{product.is_demo && <span className="demo-badge">Demo product</span>}<span className="product-category">{product.category?.name_en || "Everyday finds"}</span><div className="product-title-row"><h3 className="product-title">{product.name_en}</h3><div className="card-rating" aria-label={reviews ? `${rating.toFixed(1)} out of 5 stars from ${reviews} reviews` : "No reviews yet"}><span className="card-stars" aria-hidden="true"><span>{"\u2605".repeat(5)}</span><span className="card-stars-fill" style={{ width: `${Math.max(0, Math.min(5, rating)) * 20}%` }}>{"\u2605".repeat(5)}</span></span>{reviews ? <span className="card-rating-score">{rating.toFixed(1)} <span>({reviews})</span></span> : <span className="card-rating-empty">No reviews yet</span>}</div></div><p className="product-seller">{product.variants?.[0]?.weight_label || "Standard pack"}{product.seller_name ? ` · ${product.seller_name}` : ""}</p><div className="product-bottom"><strong><Price amount={price} /></strong><span className="product-open" aria-hidden="true"><Icon name="arrow" width={16} height={16} /></span></div></div></Link>;
}
