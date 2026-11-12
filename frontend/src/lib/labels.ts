// Fixed UI text in both languages (not data: products, categories and settings come from the API).

export const navigationLabels: Record<string, [string, string]> = {
  home: ['الرئيسية', 'Home'],
  shop: ['تسوق', 'Shop'],
  orders: ['طلباتي', 'My orders'],
  cart: ['السلة', 'Cart'],
  admin: ['الإدارة', 'Admin'],
  product: ['تفاصيل المنتج', 'Product details'],
  track: ['تتبع الطلب', 'Track order'],
};

export const adminTabsLabels: Record<string, [string, string]> = {
  overview: ['نظرة عامة', 'Overview'],
  categories: ['الأقسام', 'Categories'],
  products: ['المنتجات', 'Products'],
  warehouse: ['المخزن', 'Warehouse'],
  orders: ['الطلبات', 'Orders'],
  colors: ['الألوان', 'Colors'],
  zones: ['مناطق التوصيل', 'Delivery zones'],
  settings: ['محتوى الموقع', 'Site content'],
  password: ['كلمة المرور', 'Password'],
};

export const adminSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'FreeSize'];

export const assetPath = (path?: string | null) => {
  if (!path) return '';
  if (path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://')) return path;
  return path.startsWith('/') ? path : `/${path}`;
};

// Until the owner uploads real photos, a product shows the WEFT hoodie in its colour (public/assets/hoodies).
const hoodieColors = ['black', 'cream', 'navy', 'olive', 'burgundy', 'gray', 'blue', 'pink'];

export const hoodiePhoto = (colorNameEn?: string | null) => {
  const name = (colorNameEn ?? '').trim().toLowerCase();
  return `/assets/hoodies/${hoodieColors.includes(name) ? name : 'black'}.webp`;
};
