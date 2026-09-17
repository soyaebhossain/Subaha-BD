import { DEFAULT_LOCALE } from "./constants";
import { Locale } from "./types";

const dictionary: Record<Locale, Record<string, string>> = {
  en: {
    heroHeadline: "Organic groceries delivered fresh",
    heroSub: "60 or 120 minute delivery windows across Dhaka and outside zones.",
    viewProducts: "Shop products",
    viewCategories: "Browse categories",
    featured: "Featured picks",
    popular: "Popular this week",
    cart: "Cart",
    checkout: "Checkout",
  },
  bn: {
    heroHeadline: "Organic groceries delivered fresh",
    heroSub: "60 or 120 minute delivery windows across Dhaka and outside zones.",
    viewProducts: "Shop products",
    viewCategories: "Browse categories",
    featured: "Featured picks",
    popular: "Popular this week",
    cart: "Cart",
    checkout: "Checkout",
  },
};

export function t(locale: Locale, key: string) {
  return dictionary[locale]?.[key] ?? dictionary.en[key] ?? key;
}

export function getStoredLocale() {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = window.localStorage.getItem("lang") as Locale | null;
  return stored ?? DEFAULT_LOCALE;
}

export function setStoredLocale(locale: Locale) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("lang", locale);
}
