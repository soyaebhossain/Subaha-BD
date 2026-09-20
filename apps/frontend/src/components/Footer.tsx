import Link from "next/link";
import Icon from "./Icon";
import { Brand } from "./Header";

export default function Footer() {
  return <footer className="site-footer"><div className="site-container"><div className="footer-grid">
    <div className="footer-brand"><Brand /><p className="footer-copy">Your everyday marketplace, bringing local outlets and good finds a little closer to home.</p></div>
    <div><h2 className="footer-heading">Make yourself at home</h2><div className="footer-links"><Link href="/products">Shop all products</Link><Link href="/outlets">Explore our outlets</Link><Link href="/account/orders">Your orders</Link><Link href="/account">Your account</Link></div></div>
    <div><h2 className="footer-heading">Here to help</h2><div className="footer-links"><Link href="/contact">Help & contact</Link><Link href="/return-policy">Returns & support</Link><Link href="/privacy">Privacy</Link><Link href="/operations">Seller centre</Link></div></div>
    <div><h2 className="footer-heading">A simpler way to shop</h2><p className="footer-copy" style={{ marginTop: 0 }}>Explore your options, review delivery at checkout, and pay when your order arrives.</p><div className="footer-pay" style={{ marginTop: 17 }}><Icon name="shield" width={17} height={17} /><span style={{ fontSize: 11 }}>Cash on delivery</span></div></div>
    </div><div className="footer-bottom"><span>© {new Date().getFullYear()} Subah BD. All rights reserved.</span><span>Made for everyday life in Bangladesh. <span style={{ marginLeft: 12 }}>BDT ৳</span></span></div></div></footer>;
}
