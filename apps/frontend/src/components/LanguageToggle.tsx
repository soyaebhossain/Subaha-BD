'use client';

import { useEffect, useState } from "react";
import { getStoredLocale, setStoredLocale } from "@/lib/i18n";
import { Locale } from "@/lib/types";

const locales: Locale[] = ["en", "bn"];

export default function LanguageToggle() {
  const [locale, setLocale] = useState<Locale>(() => getStoredLocale());

  useEffect(() => {
    setStoredLocale(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 text-xs font-semibold">
      {locales.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          className={`rounded-full px-2 py-1 transition ${
            locale === value
              ? "bg-emerald-600 text-white"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          {value.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
