export default function PrivacyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Privacy</h1>
      <p className="text-sm text-slate-600">
        Content can be powered by CMS pages at /api/v1/pages/privacy. Replace
        this placeholder once the backend is ready.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <p>
          We collect minimal data to fulfill your orders and payment requests.
          Payment details are processed securely by SSLCOMMERZ, bKash, or Nagad.
        </p>
      </div>
    </div>
  );
}
