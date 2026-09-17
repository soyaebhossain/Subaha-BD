import Link from "next/link";

interface Props {
  searchParams: { status?: string; message?: string };
}

export default function PaymentReturnPage({ searchParams }: Props) {
  const status = (searchParams.status ?? "pending").toLowerCase();
  const success = status === "success";
  const heading = success ? "Payment successful" : status === "failed" ? "Payment failed" : "Payment status";
  const copy =
    searchParams.message ??
    (success
      ? "We received your payment. Your order is being confirmed."
      : "Payment was not completed. You can retry from your orders.");

  return (
    <div className="space-y-4">
      <h1 className={`text-2xl font-bold ${success ? "text-emerald-700" : "text-amber-700"}`}>
        {heading}
      </h1>
      <p className="text-sm text-slate-600">{copy}</p>
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
