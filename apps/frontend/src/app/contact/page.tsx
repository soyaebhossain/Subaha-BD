export default function ContactPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Contact</h1>
      <p className="text-sm text-slate-600">
        Use a support email, phone, or live chat hook. This placeholder can be
        replaced with CMS content at /api/v1/pages/contact.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-700 shadow-sm">
        <div className="space-y-2">
          <div className="font-semibold text-slate-900">Support</div>
          <div>Email: support@subahbd.com</div>
          <div>Phone: +8801XXXXXXXXX</div>
          <div>Hours: 9:00–22:00</div>
        </div>
      </div>
    </div>
  );
}
