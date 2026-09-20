import Link from "next/link";
import Icon from "@/components/Icon";
export default function NotFound() {
  return <div className="empty-state"><span className="empty-icon"><Icon name="search" /></span><p className="section-kicker">404 · A little off the path</p><h1 className="page-heading">Let’s find your way back.</h1><p>This page may have moved, or the product is no longer available. There’s more to discover in the marketplace.</p><Link href="/products" className="button-primary">Back to the marketplace <Icon name="arrow" width={16} height={16} /></Link></div>;
}
