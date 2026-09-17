import { DeliveryTime, Locale, PaymentMethod, Zone } from "./types";

export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Subah BD";
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export const DELIVERY_TIMES: DeliveryTime[] = ["60", "120"];
export const ZONES: Zone[] = ["dhaka", "outside"];
export const PAYMENT_METHODS: PaymentMethod[] = [
  "sslcommerz",
  "bkash",
  "nagad",
  "cod",
];

export const DEFAULT_LOCALE: Locale = "en";
