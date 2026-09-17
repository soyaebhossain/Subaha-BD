import Link from "next/link";

export default function SSLCommerzSuccessPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-emerald-700">Payment successful</h1>
      <p className="text-sm text-slate-600">
        We received your SSLCOMMERZ payment. Your order is being confirmed.
      </p>
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-sm text-emerald-800">
        You can view your order status anytime from My Orders.
      </div>
      <div className="flex gap-3">
        <Link
          href="/account/orders"
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Go to orders
        </Link>
        <Link
          href="/products"
          className="rounded-full border border-emerald-600 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
