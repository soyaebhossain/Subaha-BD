export default function ReturnPolicyPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Return policy</h1>
      <p className="text-sm text-slate-600">
        Edit this copy when the CMS content is ready at /api/v1/pages/return-policy.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <ul className="list-disc space-y-2 pl-5">
          <li>Perishables eligible for return within the delivery window.</li>
          <li>Report issues with photos for faster resolution.</li>
          <li>Refunds processed via original payment method or store credit.</li>
        </ul>
      </div>
    </div>
  );
}
