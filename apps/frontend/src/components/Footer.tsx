import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="text-lg font-semibold">{SITE_NAME}</div>
          <p className="text-sm text-slate-600">
            Fresh, organic groceries with 60/120 minute delivery windows.
          </p>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="font-semibold">Need help?</div>
          <Link href="/contact" className="block hover:text-emerald-700">
            Contact
          </Link>
          <Link href="/privacy" className="block hover:text-emerald-700">
            Privacy
          </Link>
          <Link href="/return-policy" className="block hover:text-emerald-700">
            Return policy
          </Link>
        </div>
        <div className="space-y-2 text-sm text-slate-700">
          <div className="font-semibold">Delivery</div>
          <div>Dhaka: 60 or 120 minutes</div>
          <div>Outside: 120 minutes</div>
        </div>
      </div>
      <div className="mt-8 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
