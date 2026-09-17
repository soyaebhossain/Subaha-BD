import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="text-sm text-slate-600">
          One-page checkout with delivery time, zone, and payment selection.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
