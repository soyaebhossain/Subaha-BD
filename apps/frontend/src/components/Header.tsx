'use client';

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useCartStore } from "@/store/cart.store";
import { useUserStore } from "@/store/user.store";
import { Zone } from "@/lib/types";
import Icon from "./Icon";

const subscribe = () => () => {};
export function Brand() {
  return <Link href="/" className="brand-lockup" aria-label="Subah BD home"><Image className="brand-logo" src="/images/subah-bd-logo.png" alt="Subah BD" width={112} height={112} priority /></Link>;
}

export default function Header() {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.qty, 0));
  const zone = useCartStore((state) => state.zone);
  const setZone = useCartStore((state) => state.setZone);
  const user = useUserStore((state) => state.user);
  const pathname = usePathname();
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt === pathname;
  const links = [{ href: "/products", label: "All products" }, { href: "/products?search=fresh", label: "Fresh picks" }, { href: "/outlets", label: "Our outlets" }, { href: "/account/orders", label: "Track orders" }, { href: "/operations", label: "Seller centre" }];
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="announcement"><div className="site-container announcement-inner"><span><Icon name="leaf" width={12} height={12} /> A little local. A little everyday. A lot to discover.</span><Link href="/operations">Your business, on Subah BD <span aria-hidden="true">↗</span></Link></div></div>
    <header className="site-header">
      <div className="site-container header-main"><Brand />
        <form action="/products" className="header-search" role="search"><Icon name="search" width={18} height={18} /><input name="search" aria-label="Search products" placeholder="Search for your everyday favourites…" maxLength={150} /><button aria-label="Submit search"><Icon name="arrow" width={17} height={17} /></button></form>
        <div className="header-actions"><Link href="/account" className="header-action" aria-label="Your account"><Icon name="user" /><span className="header-action-text"><small>{hydrated && user ? "Welcome back" : "Hello, welcome"}</small><strong>{hydrated && user ? (user.name?.split(" ")[0] || "My account") : "Sign in / Register"}</strong></span></Link><Link href="/cart" className="header-action" aria-label={`Shopping bag, ${hydrated ? count : 0} items`}><Icon name="bag" /><span className="cart-count">{hydrated ? Math.min(count, 99) : 0}</span><span className="header-action-text"><small>Your everyday picks</small><strong>Shopping bag</strong></span></Link><button className="mobile-menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpenAt(open ? null : pathname)}><Icon name={open ? "close" : "menu"} /></button></div>
      </div>
      <nav className="primary-nav" aria-label="Main navigation"><div className="site-container nav-inner">{links.map((link, index) => <Link key={link.href} href={link.href} className={index === 0 ? "nav-all" : ""} aria-current={pathname === link.href ? "page" : undefined}>{index === 0 && <Icon name="grid" width={15} height={15} />}{link.label}</Link>)}<span className="nav-spacer" /><label className="location-picker"><Icon name="pin" width={17} height={17} /><span>Deliver to</span><select aria-label="Delivery location" value={hydrated ? zone : "dhaka"} onChange={(e) => setZone(e.target.value as Zone)}><option value="dhaka">Dhaka</option><option value="outside">Outside Dhaka</option></select></label></div></nav>
      {open && <nav id="mobile-navigation" aria-label="Mobile navigation" className="site-container mobile-nav">{links.map((link) => <Link key={link.href} href={link.href} onClick={() => setOpenAt(null)}>{link.label}</Link>)}</nav>}
    </header>
  </>;
}
