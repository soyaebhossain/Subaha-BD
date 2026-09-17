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
} from "./types";

type FetchOptions = RequestInit & { token?: string };

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
      next: { revalidate: 60 },
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
  return fetchJSON<Category[]>("/api/v1/categories");
}

export interface GetProductsParams {
  search?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  delivery_time?: string;
  is_featured?: string;
}

export async function getProducts(params: GetProductsParams = {}) {
  const query = new URLSearchParams(
    Object.entries(params).filter(([, value]) => Boolean(value)) as [
      string,
      string,
    ][],
  );

  const qs = query.toString();
  const path = qs ? `/api/v1/products?${qs}` : "/api/v1/products";
  return fetchJSON<Product[]>(path);
}

export async function getProduct(slug: string) {
  return fetchJSON<Product>(`/api/v1/products/${slug}`);
}

// Auth
export async function authRegister(payload: AuthPayload) {
  return fetchJSON<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function authLogin(payload: AuthPayload) {
  return fetchJSON<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    cache: "no-store",
  });
}

export async function authLogout(token?: string | null) {
  return fetchJSON<null>("/api/v1/auth/logout", {
    method: "POST",
    token: token ?? undefined,
    cache: "no-store",
  });
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

export async function createOrder(body: unknown) {
  return fetchJSON<Order>("/api/v1/checkout/create-order", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getMyOrders(token?: string | null) {
  return fetchJSON<Order[]>("/api/v1/my/orders", { token });
}

export async function getMyOrder(id: string, token?: string | null) {
  return fetchJSON<Order>(`/api/v1/my/orders/${id}`, { token });
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
