import { API_BASE } from "./constants";
import {
  AuthPayload,
  AuthResponse,
  CartQuoteRequest,
  CartQuoteResponse,
  Category,
  Order,
  PaymentInitResponse,
  Product,
  User,
} from "./types";

type FetchOptions = RequestInit & { token?: string };

export interface Page<T> { count: number; next: string | null; previous: string | null; results: T[] }
export interface PriceRange { minimum: number | string | null; maximum: number | string | null; selected_min: number | string | null; selected_max: number | string | null; from_percent: number; to_percent: number }

export async function requestJSON<T>(path: string, { token, headers, ...init }: FetchOptions = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init, cache: "no-store",
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
  });
  const data = await res.json();
  if (!res.ok) {
    const message = data.detail ?? Object.values(data).flat().join(" ");
    throw new Error(typeof message === "string" ? message : "Request failed. Please try again.");
  }
  return data as T;
}

async function fetchJSON<T>(
  path: string,
  { token, headers, ...init }: FetchOptions = {},
): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      ...(!token && !init.cache && (!init.method || init.method === "GET") ? { next: { revalidate: 60 } } : { cache: "no-store" as RequestCache }),
    });

    if (!res.ok) {
      console.error(`Request failed: ${res.status} ${res.statusText}`);
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.error(`Network error for ${path}`, error);
    return null;
  }
}

export async function getCategories() {
  return fetchJSON<Category[]>("/api/v1/categories/");
}

export interface Outlet { id: number; name: string; code: string; seller_name: string; seller_kind: string; city: string; country: string; zone: string; is_active: boolean; division: string; district: string; outlet_type: "flagship" | "district"; is_demo: boolean }
export async function getOutlets(zone = "", page = 1, division = "", outletType = "") {
  return fetchJSON<Page<Outlet>>(`/api/v1/outlets/?${new URLSearchParams({ page: String(page), zone, division, outlet_type: outletType })}`);
}

export async function getContentPage(slug: string) {
  return fetchJSON<{ title_en: string; body_en: string }>(`/api/v1/pages/${encodeURIComponent(slug)}/`);
}

export interface GetProductsParams {
  price_from?: string;
  price_to?: string;
  page?: string;
  page_size?: string;
  search?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  delivery_time?: string;
  is_featured?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const result = await getProductPage(params);
  return result?.results ?? null;
}

export async function getProductPage(params: GetProductsParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  );

  const qs = query.toString();
  const path = qs ? `/api/v1/products/?${qs}` : "/api/v1/products/";
  return fetchJSON<Page<Product> & { price_range: PriceRange }>(path);
}

export async function getProduct(slug: string) {
  return fetchJSON<Product>(`/api/v1/products/${encodeURIComponent(slug)}/`);
}

// Auth
export async function authRegister(payload: AuthPayload) {
  const registered = await fetchJSON<User>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  return registered ? authLogin(payload) : null;
}

export async function authLogin(payload: AuthPayload) {
  const response = await fetchJSON<{ access: string; refresh: string }>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  if (!response?.access) return null;
  const user = await authMe(response.access);
  return user ? { token: response.access, user } as AuthResponse : null;
}

export async function authLogout(token?: string | null) {
  void token;
  return null;
}

export async function authMe(token?: string | null) {
  return fetchJSON<{ id: number; email: string; name?: string }>("/api/v1/auth/me", {
    token: token ?? undefined,
    cache: "no-store",
  });
}

export async function quoteCart(body: CartQuoteRequest) {
  return fetchJSON<CartQuoteResponse>("/api/v1/cart/quote", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createOrder(body: unknown, token?: string) {
  return requestJSON<Order>("/api/v1/checkout/create-order", {
    token,
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMyOrders(token?: string | null, page = 1) {
  return fetchJSON<Page<Order>>(`/api/v1/my/orders/?page=${page}`, { token: token ?? undefined });
}

export async function getMyOrder(id: string, token?: string | null) {
  return fetchJSON<Order>(`/api/v1/my/orders/${id}/`, { token: token ?? undefined });
}

// Payments
export async function initSSLCommerz(orderId: number | string) {
  return fetchJSON<PaymentInitResponse>("/api/v1/payments/sslcommerz/init", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
    cache: "no-store",
  });
}

export async function initBkash(orderId: number | string) {
  return fetchJSON<PaymentInitResponse>("/api/v1/payments/bkash/create", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
    cache: "no-store",
  });
}

export async function initNagad(orderId: number | string) {
  return fetchJSON<PaymentInitResponse>("/api/v1/payments/nagad/init", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
    cache: "no-store",
  });
}

export async function confirmCOD(orderId: number | string) {
  return fetchJSON<PaymentInitResponse>("/api/v1/payments/cod/confirm", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId }),
    cache: "no-store",
  });
}
