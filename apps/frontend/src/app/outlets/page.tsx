import Link from "next/link";
import Icon from "@/components/Icon";
import { getOutlets } from "@/lib/api";

const divisions = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh"];

export default async function OutletsPage({ searchParams }: { searchParams: Promise<{ zone?: string; page?: string; division?: string; outlet_type?: string }> }) {
  const query = await searchParams;
  const division = divisions.includes(query.division || "") ? query.division! : "";
  const kind = ["flagship", "district"].includes(query.outlet_type || "") ? query.outlet_type! : "";
  const zone = ["dhaka", "outside"].includes(query.zone || "") ? query.zone! : "";
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);
  const [outlets, flagships, districts] = await Promise.all([getOutlets(zone, page, division, kind), getOutlets("", 1, "", "flagship"), getOutlets("", 1, "", "district")]);
  const href = (changes: Record<string, string>) => `/outlets?${new URLSearchParams({ division, outlet_type: kind, zone, ...changes })}`;
  return <>
    <div className="breadcrumb"><Link href="/">Home</Link><Icon name="chevron" /><span>Our outlets</span></div>
    <section className="network-hero"><div><p className="eyebrow">One brand. A nationwide vision.</p><h1 className="page-heading mt-4">Your neighbourhood.<br />Our next chapter.</h1><p className="page-intro">Explore our divisional flagship shops and district outlets across Bangladesh.</p></div><div className="network-metrics"><div><strong>{flagships?.count ?? "—"}</strong><span>Flagship shops</span></div><div><strong>{districts?.count ?? "—"}</strong><span>District outlets</span></div></div></section>
    {outlets?.results.some(o => o.is_demo) && <p className="demo-notice my-6">Demo network · These locations illustrate the planned network. Opening dates, street addresses and live availability are not yet confirmed.</p>}
    <nav aria-label="Filter outlets by division" className="division-tabs">{["", ...divisions].map(value => <Link href={href({ division: value })} key={value} aria-current={division === value ? "page" : undefined}>{value || "All divisions"}</Link>)}</nav>
    <div className="network-toolbar"><nav aria-label="Filter outlets by type" className="flex flex-wrap gap-2">{[{ value: "", title: "All locations" }, { value: "flagship", title: "Flagship shops" }, { value: "district", title: "District outlets" }].map(filter => <Link href={href({ outlet_type: filter.value })} key={filter.value} className={kind === filter.value ? "button-primary" : "button-secondary"} aria-current={kind === filter.value ? "page" : undefined}>{filter.title}</Link>)}</nav><span className="section-kicker">{outlets?.count ?? 0} locations {division && `in ${division}`}</span></div>
    {outlets?.results.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{outlets.results.map(outlet => <article key={outlet.id} className={`surface-panel outlet-card ${outlet.outlet_type === "flagship" ? "flagship-card" : ""}`}><div className="mb-6 flex items-center justify-between gap-2"><span className="category-art" style={{ width: 44, height: 44 }}><Icon name="store" /></span><span className="outlet-kind">{outlet.outlet_type === "flagship" ? "Divisional flagship" : "District outlet"}</span></div><p className="section-kicker mb-2">{outlet.division || outlet.country}</p><h2 className="text-lg font-semibold tracking-tight">{outlet.name}</h2><p className="mt-2 text-xs text-slate-500">{outlet.seller_kind === "owned" ? "Own branch" : outlet.seller_kind === "franchise" ? "Franchise branch" : "Seller partner"}{outlet.is_demo && " · Demo location"}</p><p className="mt-5 flex items-center gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500"><Icon name="pin" width={15} height={15} />{outlet.district || outlet.city}, Bangladesh</p></article>)}</div> : <div className="empty-state"><Icon name="store" /><h2>{outlets ? "No locations in this selection." : "We couldn’t load our outlets."}</h2><Link className="button-secondary mt-5" href="/outlets">View all outlets</Link></div>}
    {outlets && outlets.count > 24 && <nav className="pagination-bar" aria-label="Outlet pages">{outlets.previous ? <Link href={href({ page: String(page - 1) })}>← Previous</Link> : <span />}<span>Page {page} of {Math.ceil(outlets.count / 24)}</span>{outlets.next ? <Link href={href({ page: String(page + 1) })}>Next →</Link> : <span />}</nav>}
  </>;
}
