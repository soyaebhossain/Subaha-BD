import CheckoutForm from "@/components/CheckoutForm";
import Icon from "@/components/Icon";
import Link from "next/link";

export default function CheckoutPage() {
  return (
    <div className="space-y-7">
      <div>
        <div className="breadcrumb"><Link href="/cart">Shopping bag</Link><Icon name="chevron" /><span>Checkout</span></div>
        <p className="eyebrow">Almost at your doorstep</p>
        <h1 className="page-heading mt-3">Make it yours.</h1>
        <p className="page-intro">A few details, one final review, and you’re all set.</p>
      </div>
      <CheckoutForm />
    </div>
  );
}
