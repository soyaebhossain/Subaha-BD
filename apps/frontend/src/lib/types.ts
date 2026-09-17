export type Locale = "en" | "bn";
export type Zone = "dhaka" | "outside";
export type DeliveryTime = "60" | "120";
export type PaymentMethod = "sslcommerz" | "bkash" | "nagad" | "cod";
export type SortOption = "price_asc" | "price_desc" | "newest";

export interface Category {
  id: number;
  name_en: string;
  name_bn?: string;
  slug: string;
  is_active?: boolean;
  sort?: number;
}

export interface ProductImage {
  id?: number;
  url: string;
  sort?: number;
}

export interface ProductVariant {
  id?: number;
  sku?: string;
  weight_label?: string;
  stock?: number;
  extra_price?: number;
  is_active?: boolean;
}

export interface Product {
  id: number;
  category?: Category;
  name_en: string;
  name_bn?: string;
  desc_en?: string;
  desc_bn?: string;
  base_price: number;
  slug: string;
  is_active?: boolean;
  is_featured?: boolean;
  variants?: ProductVariant[];
  images?: ProductImage[];
}

export interface CartLineInput {
  product_id: number;
  variant_id?: number;
  qty: number;
}

export interface CartQuoteRequest {
  items: CartLineInput[];
  zone: Zone;
  delivery_time: DeliveryTime;
  coupon_code?: string;
}

export interface CartQuoteResponse {
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
}

export interface OrderItem {
  product: Product;
  variant?: ProductVariant;
  qty: number;
  price: number;
  total: number;
}

export interface Order {
  id: number;
  status: string;
  total: number;
  subtotal?: number;
  discount?: number;
  delivery_fee?: number;
  delivery_time?: DeliveryTime;
  zone?: Zone;
  items?: OrderItem[];
  created_at?: string;
}

export interface User {
  id: number;
  email: string;
  name?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface PaymentInitResponse {
  redirect_url?: string;
  payment_id?: string;
  bkashURL?: string; // some gateways return custom field names
}
