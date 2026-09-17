import Link from "next/link";

export default function SSLCommerzFailPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-rose-700">Payment failed</h1>
      <p className="text-sm text-slate-600">
        The SSLCOMMERZ payment was not completed. Your order remains pending.
      </p>
      <div className="rounded-2xl border border-rose-100 bg-rose-50 p-6 text-sm text-rose-800">
        You can retry payment from your order details or place a new order.
      </div>
      <div className="flex gap-3">
        <Link
          href="/account/orders"
          className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
        >
          View orders
        </Link>
        <Link
          href="/checkout"
          className="rounded-full border border-rose-600 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
        >
          Try again
        </Link>
      </div>
    </div>
  );
}
