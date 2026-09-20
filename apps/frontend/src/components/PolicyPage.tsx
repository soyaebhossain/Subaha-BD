import Link from "next/link";
import Icon from "./Icon";
import { getContentPage } from "@/lib/api";

export default async function PolicyPage({ slug, title, description }: { slug: string; title: string; description: string }) {
  const page = await getContentPage(slug);
  return <div className="mx-auto max-w-3xl"><div className="breadcrumb"><Link href="/">Home</Link><Icon name="chevron" /><span>{title}</span></div><p className="eyebrow">Shopping with confidence</p><h1 className="page-heading mt-3">{page?.title_en || title}</h1><p className="page-intro mb-8">{description}</p><article className="surface-panel text-sm leading-8 text-slate-600">{page?.body_en ? <div className="whitespace-pre-wrap">{page.body_en}</div> : <><h2 className="mb-3 font-semibold text-slate-900">Information will be published here.</h2><p>The detailed {title.toLowerCase()} is not yet available. Please check back before placing an order, or visit our help page for the information currently available.</p><Link href="/contact" className="text-link mt-6">Visit the help centre <Icon name="arrow" /></Link></>}</article></div>;
}
