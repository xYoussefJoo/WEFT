import { api, call, ApiError, type Problem, type Schemas } from '@/lib/api';

export type CategoryNode = Schemas['CategoryNode'];
export type ProductCard = Schemas['ProductCard'];
export type ProductDetail = Schemas['ProductDetail'];
export type Variant = Schemas['VariantDto'];
export type SiteContent = Schemas['SiteContent'];
export type Zone = Schemas['ZoneDto'];
export type PublicOrder = Schemas['PublicOrderDto'];
export type PlacedOrder = Schemas['PlacedOrderDto'];
export type CheckoutCustomer = Schemas['CheckoutCustomer'];
export type OrderStatus = Schemas['OrderStatus'];

export type ProductQuery = {
  category?: string;
  q?: string;
  size?: string[];
  color?: number[];
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sort?: 'newest' | 'price_asc' | 'price_desc' | 'name';
  page?: number;
  pageSize?: number;
};

// ---------- catalog (#5–#8)
export const getCategories = () => call(api.GET('/api/categories'));
export const getSiteSettings = () => call(api.GET('/api/site-settings'));
export const searchProducts = (query: ProductQuery) =>
  call(api.GET('/api/products', { params: { query } }));
export const getProduct = (slug: string) => call(api.GET('/api/products/{slug}', { params: { path: { slug } } }));

// ---------- checkout + tracking (#9–#11)
export const getDeliveryZones = () => call(api.GET('/api/delivery-zones'));

export const placeOrder = (body: Schemas['PlaceOrderCommand'], idempotencyKey: string) =>
  call(api.POST('/api/orders', { body, params: { header: { 'Idempotency-Key': idempotencyKey } } }));

// Track without the link: order number + the phone or email used at checkout.
export const lookupOrder = (number: string, contact: string) =>
  call(api.POST('/api/orders/lookup', { body: { number, contact } }));
export const trackOrder = (number: string, token: string) =>
  call(api.GET('/api/orders/{number}', { params: { path: { number }, header: { 'X-Tracking-Token': token } } }));


// openapi-fetch can't send FormData nicely, so multipart goes through fetch with the same error shape.
export async function postForm<T>(path: string, form: FormData, headers: Record<string, string> = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { method: 'POST', body: form, headers, credentials: 'same-origin' });
  } catch {
    throw new ApiError({ status: 0, code: 'NETWORK', detail: 'Network error' });
  }
  const text = await response.text();
  const body = text ? JSON.parse(text) : undefined;
  if (response.ok) return body as T;
  if (response.status === 401 && path.startsWith('/api/admin')) window.dispatchEvent(new Event('weft:signed-out'));
  throw new ApiError({ ...((body ?? {}) as Partial<Problem>), status: response.status });
}

// ---------- "my orders": number + tracking token kept on this device (the token is the only key to the order)
export type SavedOrder = { number: string; token: string; createdAt: string };
const MY_ORDERS_KEY = 'weft_my_orders';

export function savedOrders(): SavedOrder[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY);
    const list = raw ? (JSON.parse(raw) as SavedOrder[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function rememberOrder(order: SavedOrder) {
  try {
    const list = savedOrders().filter((o) => o.number !== order.number);
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify([order, ...list].slice(0, 50)));
  } catch {
    // private window or storage full: the tracking link still works
  }
}

export const trackingPath = (number: string, token: string) =>
  `/track/${encodeURIComponent(number)}?t=${encodeURIComponent(token)}`;

// ---------- display helpers
export const pick = (lang: 'ar' | 'en', ar?: string | null, en?: string | null) =>
  (lang === 'ar' ? ar || en : en || ar) ?? '';

export const statusLabel: Record<OrderStatus, [string, string]> = {
  PendingConfirmation: ['بانتظار التأكيد', 'Awaiting confirmation'],
  Confirmed: ['تم التأكيد', 'Confirmed'],
  Packing: ['قيد التغليف', 'Packing'],
  Shipped: ['تم الشحن', 'Shipped'],
  Delivered: ['تم التسليم', 'Delivered'],
  Cancelled: ['ملغي', 'Cancelled'],
};

export const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
