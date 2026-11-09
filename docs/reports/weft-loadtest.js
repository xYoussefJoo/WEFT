// k6 load test for WEFT (store on Vercel + API on MonsterASP through the store's /api rewrite).
// Run ONLY against a deployment you own, ideally outside peak hours:
//   k6 run -e BASE_URL=https://weft-xi-two.vercel.app docs/reports/weft-loadtest.js
// It never creates orders or sends emails: the "checkout" scenario sends an order with a deliberately wrong
// expected total, which the API refuses with 409 PRICE_CHANGED before saving anything.
// The API allows 10 order attempts per 10 minutes per IP, so that scenario runs at 1 per minute.
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    browse: {
      executor: 'ramping-vus', startVUs: 0,
      stages: [{ duration: '1m', target: 25 }, { duration: '2m', target: 100 }, { duration: '1m', target: 0 }],
      exec: 'browse',
    },
    checkout: { executor: 'constant-arrival-rate', rate: 1, timeUnit: '1m', duration: '4m', preAllocatedVUs: 1, exec: 'checkout' },
  },
  thresholds: {
    'http_req_failed{scenario:browse}': ['rate<0.01'],
    'http_req_duration{scenario:browse}': ['p(95)<800'],
  },
};

const BASE = __ENV.BASE_URL || 'https://weft-xi-two.vercel.app';
const slugs = ['weft-essential-hoodie', 'weft-oversized-hoodie', 'weft-signature-hoodie', 'weft-everyday-hoodie'];

export function browse() {
  const home = http.get(`${BASE}/`);
  check(home, { 'home 200': (r) => r.status === 200 });
  const list = http.get(`${BASE}/api/products?pageSize=20`);
  check(list, { 'products 200': (r) => r.status === 200 });
  const slug = slugs[Math.floor(Math.random() * slugs.length)];
  check(http.get(`${BASE}/products/${slug}`), { 'product page 200': (r) => r.status === 200 });
  check(http.get(`${BASE}/api/products/${slug}`), { 'product api 200': (r) => r.status === 200 });
  sleep(5); // typical read time
}

export function checkout() {
  const product = http.get(`${BASE}/api/products/weft-essential-hoodie`).json();
  const zones = http.get(`${BASE}/api/delivery-zones`).json();
  const body = JSON.stringify({
    customer: { name: 'Load Test', phone: '01012345678', email: null, deliveryZoneId: zones[0].id,
      city: 'Test', address: 'Load test - no order is created', notes: null },
    lines: [{ variantId: product.variants[0].id, qty: 1 }],
    paymentMethod: 'CashOnDelivery',
    expectedTotal: 1, // wrong on purpose: refused with 409 before anything is saved
    acceptTerms: true,
  });
  const res = http.post(`${BASE}/api/orders`, body, {
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `${__VU}-${__ITER}-${Date.now()}` },
  });
  check(res, { 'order refused safely (409)': (r) => r.status === 409 });
}
