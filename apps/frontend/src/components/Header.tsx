import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";
import LanguageToggle from "./LanguageToggle";

const links = [
  { href: "/products", label: "Products" },
  { href: "/cart", label: "Cart" },
  { href: "/checkout", label: "Checkout" },
  { href: "/account/orders", label: "My Orders" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          {SITE_NAME}
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 sm:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-emerald-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/cart"
            className="rounded-full border border-emerald-600 px-4 py-1 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Cart
          </Link>
        </div>
      </div>
    </header>
  );
}
