import Link from "next/link";

export default function SSLCommerzCancelPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-amber-700">Payment cancelled</h1>
      <p className="text-sm text-slate-600">
        You cancelled the SSLCOMMERZ payment. The order is still pending; you can pay later or reorder.
      </p>
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-6 text-sm text-amber-800">
        If you faced an issue, you can retry from the order details page.
      </div>
      <div className="flex gap-3">
        <Link
          href="/account/orders"
          className="rounded-full bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800"
        >
          View orders
        </Link>
        <Link
          href="/checkout"
          className="rounded-full border border-amber-600 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50"
        >
          Retry checkout
        </Link>
      </div>
    </div>
  );
}
