'use client';

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { authLogin, authRegister } from "@/lib/api";
import { clearAccessToken, setAccessToken } from "@/lib/auth";
import { useUserStore } from "@/store/user.store";
import Icon from "@/components/Icon";

export default function AccountPage() {
  const { user, setAuth, logout } = useUserStore();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = { email: String(data.get("email")), password: String(data.get("password")), name: String(data.get("name") || "") };
    try {
      const result = mode === "login" ? await authLogin(payload) : await authRegister(payload);
      if (result) { setAuth(result.token, result.user); setAccessToken(result.token); }
      else setMessage(mode === "login" ? "We couldn’t sign you in. Check your email and password, then try again." : "We couldn’t create this account. Use an unregistered email and a strong password with at least 8 characters.");
    } catch { setMessage("We couldn’t connect just now. Please try again shortly."); }
    finally { setBusy(false); }
  }
  if (user) return <><div className="breadcrumb"><Link href="/">Home</Link><Icon name="chevron" /><span>Your account</span></div><div className="catalog-top"><div><p className="eyebrow">Your little corner</p><h1 className="page-heading mt-3">Hello, {user.name?.split(" ")[0] || "there"}.</h1><p className="page-intro">It’s good to have you here.</p></div><button className="button-secondary" onClick={() => { logout(); clearAccessToken(); }}>Sign out</button></div><div className="surface-panel mb-6"><p className="font-semibold">{user.name || "Your account"}</p><p className="mt-1 text-sm text-slate-500">{user.email}</p><p className="mt-5 text-xs text-emerald-700">Signed in. Your orders and checkout will use this profile.</p></div><div className="grid gap-5 md:grid-cols-3">{[{ icon: "box" as const, title: "Your orders", copy: "Follow every pick from outlet to doorstep.", href: "/account/orders" }, { icon: "bag" as const, title: "Your shopping bag", copy: "Pick up where you left off.", href: "/cart" }, { icon: "store" as const, title: "Seller & outlet operations", copy: "Your workspace for stock and fulfillment.", href: "/operations" }].map((item) => <Link href={item.href} key={item.href} className="surface-panel hover:border-emerald-200"><Icon name={item.icon} /><h2 className="mb-2 mt-6 font-semibold">{item.title}</h2><p className="mb-5 text-xs text-slate-500">{item.copy}</p><Icon name="arrow" width={18} height={18} /></Link>)}</div></>;
  return <div className="mx-auto grid max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-2"><div className="relative hidden min-h-[610px] overflow-hidden bg-[#e5e8f0] md:block"><div className="relative z-10 p-10"><p className="eyebrow">Good things, closer</p><h2 className="mt-7 text-4xl font-medium leading-tight tracking-[-1.5px]">Your everyday.<br />A little more lovely.</h2><p className="mt-4 max-w-xs text-sm leading-7 text-slate-500">Keep your favourites close and your orders in one place.</p></div><Image src="/images/market-basket.png" alt="Fresh everyday groceries" fill sizes="500px" className="object-contain object-bottom pt-64 mix-blend-multiply" /></div><div className="p-7 sm:p-12"><Link href="/" className="text-link mb-9">← Back to the marketplace</Link><p className="section-kicker">Your Subah BD account</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">{mode === "login" ? "Welcome back." : "Make yourself at home."}</h1><p className="mt-3 text-xs leading-6 text-slate-500">{mode === "login" ? "Sign in to track your orders and make checkout simpler." : "Create your account for a more connected shopping experience."}</p><div className="mb-7 mt-7 grid grid-cols-2 rounded-lg bg-slate-50 p-1">{(["login", "register"] as const).map((value) => <button key={value} onClick={() => { setMode(value); setMessage(""); }} className={`rounded-md py-2.5 text-xs font-semibold ${mode === value ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500"}`}>{value === "login" ? "Login" : "Create account"}</button>)}</div><form key={mode} onSubmit={submit} className="space-y-5">{mode === "register" && <label className="block text-xs font-medium">Full name<input name="name" autoComplete="name" required maxLength={255} className="filter-field mt-2" placeholder="Your name" /></label>}<label className="block text-xs font-medium">Email<input name="email" type="email" autoComplete="email" required className="filter-field mt-2" placeholder="you@example.com" /></label><label className="block text-xs font-medium">Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 8 : undefined} className="filter-field mt-2" placeholder={mode === "register" ? "Create a strong password" : "Your password"} /></label>{message && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-xs leading-6 text-amber-800">{message}</p>}<button disabled={busy} className="button-primary w-full">{busy ? "Please wait…" : mode === "login" ? "Login" : "Create account"}<Icon name="arrow" width={16} height={16} /></button><p className="text-center text-[10px] leading-5 text-slate-500">Read how we handle your information in our <Link className="underline" href="/privacy">privacy notice</Link>.</p></form></div></div>;
}
