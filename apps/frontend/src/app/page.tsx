import Link from "next/link";
import { getCategories, getProducts } from "@/lib/api";
import HeroSlider from "@/components/HeroSlider";

type CardProduct = {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  discountText?: string;
  rating?: number;
  soldText?: string;
  image: string;
  slug?: string;
};

type CardCategory = {
  id: string;
  title: string;
  icon: string;
  slug?: string;
};

function formatBDT(n: number) {
  return "৳ " + n.toLocaleString("en-US");
}

function ProductCardLite({ p }: { p: CardProduct }) {
  const imgSrc =
    p.image && p.image.trim().length > 0
      ? p.image
      : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80";

  return (
    <Link href={`/products/${p.slug ?? p.id}`} className="pCard">
      <div className="pImgWrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="pImg" src={imgSrc} alt={p.title} loading="lazy" />
        {p.discountText ? <span className="pBadge">{p.discountText}</span> : null}
      </div>
      <div className="pBody">
        <div className="pTitle" title={p.title}>
          {p.title}
        </div>
        <div className="pPriceRow">
          <span className="pPrice">{formatBDT(p.price)}</span>
          {p.oldPrice ? <span className="pOld">{formatBDT(p.oldPrice)}</span> : null}
        </div>
        <div className="pMeta">
          <span>★ {p.rating ?? 4.2}</span>
          <span className="dot">•</span>
          <span>{p.soldText ?? "Sold"}</span>
        </div>
      </div>
    </Link>
  );
}

const fallbackFlash: CardProduct[] = [
  {
    id: "p1",
    title: "VS Badminton Racket TITAN 7 Feel String-Grip",
    price: 614,
    oldPrice: 1299,
    discountText: "-53%",
    rating: 4.6,
    soldText: "2.4k sold",
    image: "https://images.unsplash.com/photo-1521412644187-c49fa049e84d?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "p2",
    title: "Mini Electric Massage Gun Portable Deep Tissue",
    price: 657,
    oldPrice: 1650,
    discountText: "-60%",
    rating: 4.4,
    soldText: "1.1k sold",
    image: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "p3",
    title: "Walton 30 Liter Water Heater/Geyser with...",
    price: 11900,
    oldPrice: 14900,
    discountText: "-20%",
    rating: 4.7,
    soldText: "650 sold",
    image: "https://images.unsplash.com/photo-1581579185169-69b61c1a6d5a?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "p4",
    title: "High Quality Multicolor Silicone Kitchen Hand...",
    price: 635,
    oldPrice: 950,
    discountText: "-33%",
    rating: 4.3,
    soldText: "3.0k sold",
    image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "p5",
    title: "Electric Hot Water Bag pain remover...",
    price: 612,
    oldPrice: 990,
    discountText: "-38%",
    rating: 4.5,
    soldText: "5.8k sold",
    image: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=900&q=80&auto=format&fit=crop",
  },
];

const fallbackCats: CardCategory[] = [
  { id: "c1", title: "Hoses & Pipes", icon: "https://cdn-icons-png.flaticon.com/512/2909/2909764.png" },
  { id: "c2", title: "Black Tea", icon: "https://cdn-icons-png.flaticon.com/512/590/590749.png" },
  { id: "c3", title: "Cheese Tools", icon: "https://cdn-icons-png.flaticon.com/512/3075/3075977.png" },
  { id: "c4", title: "Kitchen Fittings", icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png" },
  { id: "c5", title: "Women's Fashion", icon: "https://cdn-icons-png.flaticon.com/512/892/892458.png" },
  { id: "c6", title: "Ovens", icon: "https://cdn-icons-png.flaticon.com/512/1046/1046784.png" },
  { id: "c7", title: "Goat", icon: "https://cdn-icons-png.flaticon.com/512/616/616556.png" },
  { id: "c8", title: "Watches", icon: "https://cdn-icons-png.flaticon.com/512/747/747310.png" },
];

const fallbackJust: CardProduct[] = [
  {
    id: "j1",
    title: "Digital Scale 10kg Household Weight Scale",
    price: 380,
    oldPrice: 520,
    discountText: "-27%",
    rating: 4.2,
    soldText: "9.1k sold",
    image: "https://images.unsplash.com/photo-1615485925873-6f6f2e20e671?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "j2",
    title: "Velvet Shawls 2025 Luxury Brand Women",
    price: 980,
    oldPrice: 1500,
    discountText: "-35%",
    rating: 4.5,
    soldText: "2.1k sold",
    image: "https://images.unsplash.com/photo-1520975958225-6b03a58a6d88?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "j3",
    title: "Colorful Golf Interactive Ball cat toy",
    price: 80,
    oldPrice: 120,
    discountText: "-33%",
    rating: 4.1,
    soldText: "12k sold",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900&q=80&auto=format&fit=crop",
  },
  {
    id: "j4",
    title: "Avantech Battery Charger Universal Smart",
    price: 178,
    oldPrice: 260,
    discountText: "-32%",
    rating: 4.0,
    soldText: "4.7k sold",
    image: "https://images.unsplash.com/photo-1580464028280-3236c1f71b41?w=900&q=80&auto=format&fit=crop",
  },
];

export default async function Page() {
  const [cats, prods] = await Promise.all([getCategories(), getProducts({})]);

  const mappedProducts: CardProduct[] =
    prods?.map((p) => ({
      id: String(p.id),
      slug: p.slug,
      title: p.name_en,
      price: Number(p.base_price ?? 0),
      oldPrice: undefined,
      discountText: undefined,
      rating: 4.5,
      soldText: "Popular",
      image:
        p.images?.[0]?.url && p.images[0].url.length > 0
          ? p.images[0].url
          : "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
    })) ?? [];

  const flashProducts = mappedProducts.slice(0, 10);
  const justProducts = mappedProducts.slice(10, 18);

  const mappedCats: CardCategory[] =
    cats?.map((c) => ({
      id: String(c.id),
      slug: c.slug,
      title: c.name_en,
      icon: "https://cdn-icons-png.flaticon.com/512/1046/1046857.png",
    })) ?? [];

  const slides = [
    {
      title: "NEW YEAR MEGA SALE",
      subtitle: "35% OFF",
      pills: ["FREE DELIVERY", "150TK VOUCHER"],
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1400&q=80&auto=format&fit=crop",
      ctaLabel: "Shop Now",
      ctaHref: "/products",
    },
    {
      title: "WEEKEND SUPER DEALS",
      subtitle: "Up to 50% OFF",
      pills: ["FLASH SALE", "COD & ONLINE"],
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&q=80&auto=format&fit=crop",
      ctaLabel: "View Deals",
      ctaHref: "/products",
    },
    {
      title: "FRESH GROCERY PICKS",
      subtitle: "Delivered in 60 min",
      pills: ["Dhaka", "Outside 120 min"],
      image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1400&q=80&auto=format&fit=crop",
      ctaLabel: "Order Now",
      ctaHref: "/checkout",
    },
  ];

  return (
    <div className="page">
      <div className="topbar">
        <div className="container topbarInner">
          <div className="topLinks">
            <Link href="#">SAVE MORE ON APP</Link>
            <Link href="#">BECOME A SELLER</Link>
            <Link href="#">HELP & SUPPORT</Link>
          </div>
          <div className="topLinks">
            <Link href="/account">LOGIN</Link>
            <Link href="/account">SIGN UP</Link>
            <Link href="#">LANG</Link>
          </div>
        </div>
      </div>

      <header className="headerCustom">
        <div className="container headerInner">
          <Link href="/" className="logo brand">
            <div className="logoMark brandInitial">S</div>
            <div className="logoText">
              <div className="logoMain">Subah <span className="logoHighlight">BD</span></div>
              <div className="logoSub">সুবাহ’র প্রোভাইড সুস্বাস্থ্য ও সফলতার পথ</div>
            </div>
          </Link>
          <div className="searchWrap">
            <input className="searchInput" placeholder="Search products" />
            <button className="searchBtn">🔍</button>
          </div>
          <div className="headerRight">
            <Link href="/cart" className="iconBtn" aria-label="Cart">
              🛒
            </Link>
          </div>
        </div>
      </header>

      <section className="container hero">
        <HeroSlider slides={slides} />

        <aside className="sideCard">
          <div className="sideHead">Download the App</div>
          <div className="sideRow">
            <span className="sideDot" />
            <div>
              <div className="sideTitle">Free Delivery</div>
              <div className="sideSub">Limited Time</div>
            </div>
          </div>
          <div className="sideRow">
            <span className="sideDot" />
            <div>
              <div className="sideTitle">Exclusive Deals</div>
              <div className="sideSub">App Only</div>
            </div>
          </div>
          <div className="storeBtns">
            <button className="storeBtn">App Store</button>
            <button className="storeBtn">Google Play</button>
          </div>
        </aside>
      </section>

      <section className="container section">
        <div className="sectionHead">
          <h2>Flash Sale</h2>
          <Link href="/products" className="ghostBtn">
            SHOP ALL PRODUCTS
          </Link>
        </div>
        <div className="grid5">
          {(flashProducts.length ? flashProducts : fallbackFlash).map((p) => (
            <ProductCardLite key={p.id} p={p} />
          ))}
        </div>
      </section>

      <section className="container section">
        <div className="sectionHead">
          <h2>Categories</h2>
        </div>
        <div className="catGrid">
          {(mappedCats.length ? mappedCats : fallbackCats).map((c) => (
            <Link
              key={c.id}
              href={`/products?category=${c.slug ?? c.id}`}
              className="catCard"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.icon} alt={c.title} className="catIcon" />
              <div className="catTitle">{c.title}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="container section" style={{ paddingBottom: 40 }}>
        <div className="sectionHead">
          <h2>Just For You</h2>
        </div>
        <div className="grid5">
          {(justProducts.length ? justProducts : fallbackJust).map((p) => (
            <ProductCardLite key={p.id} p={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
