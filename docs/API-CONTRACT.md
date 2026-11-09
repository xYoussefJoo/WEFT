# WEFT — API Contract

> **Version** 1.2 · 2026-11-07 (synced with the code after Day 4) · Generated from the same source as `Weft-API-Plan.docx` and `Weft-API-Specifications.docx`.
> **Machine-readable:** `docs/openapi.json` is exported from the running API. Generate TypeScript types from it with `npx openapi-typescript ../docs/openapi.json -o src/types/api.ts` (run in `frontend/`).
> The backend is built against this file, and the Next.js UI uses the same file. Change the route or shape here and in the docs together.

**37 endpoints:** 7 public · 4 auth · 26 admin (+ `GET /health`). Numbers come from the Zamzam base this API was copied from; the gaps (#12–16, #38–40, #45–46) were the tailoring endpoints, removed for WEFT.

## 0. Conventions

| Topic | Rule |
|---|---|
| Stack | ASP.NET Core 10 Web API (Controllers) · Clean Architecture · PostgreSQL 17 · EF Core migrations · Next.js frontend |
| Routing | `/api/{resource}`, admin under `/api/admin/{resource}`. The browser calls `/api/*` on the site's own domain; Next.js forwards to the API |
| Users | **One Owner account.** Customers never log in (guest checkout). The role system stays in the code so staff can be added later |
| Auth | ASP.NET Identity httpOnly cookie `zz.auth` (Secure, SameSite=Strict, 8 h sliding). Lockout after 5 failed logins |
| CSRF guard | Every POST/PUT/PATCH/DELETE to `/api/admin/*` and `/api/auth/*` sends `X-Requested-With: weft-admin` (otherwise `400 MISSING_CSRF_HEADER`) |
| Customer access | Order number + `X-Tracking-Token` header (never in an API query string) |
| Format | JSON camelCase · money in EGP with 2 decimals · ISO-8601 UTC dates · bilingual fields `nameAr` + `nameEn` · phones stored as `+201xxxxxxxxx` |
| Pagination | `?page=1&pageSize=20` (max 100) → `{ items, page, pageSize, totalCount, totalPages }` |
| Errors | RFC 9457 ProblemDetails with `code` and `traceId` (see Appendix B) |
| Idempotency | `POST /api/orders` requires `Idempotency-Key: <uuid>` |
| Rate limits (per IP) | every request 300/min (global) · login 5/min · order creation 10 per 10 min · tracking 30/min. A 429 has an empty body and a Retry-After header |
| Caching | `Cache-Control: public, max-age=300` on categories, site settings and delivery zones. Products are not cached yet |
| Behind Vercel | The API trusts `X-Forwarded-For` only when the request carries `X-Proxy-Secret` (= `Proxy:SharedSecret`, 32+ chars). Next.js `rewrites()` can't add it, so the frontend forwards `/api` from `src/proxy.ts` — **required before launch** |
| Health | `GET /health` → `{ "status", "db", "storage" }`, `no-store`, no rate limit. 503 only when the database is down |
| Security headers | Every response: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `CSP default-src 'none'`, `CORP same-site`; HSTS outside Development. No CORS: only same-site calls |
| Empty bodies | `401` (not signed in), `403` and `429` have no body; read the status code |


---

## 1. Identity & Auth APIs (`/api/auth`)

_Owner login. Customers never log in. One Owner account today; the role system stays in place so employees can be added later._

### #1 `POST /api/auth/login`

Authenticates the owner and sets the auth cookie.

- **Access:** Public · rate limit 5/min per IP · **Day 1**

**Payload**

```json
{
  "email": "owner@weft.com",
  "password": "Password123!",
  "rememberMe": false
}
```

**Response 200 OK**

```json
{
  "id": "a1b2c3",
  "fullName": "Owner Name",
  "email": "owner@weft.com",
  "role": "Owner",
  "mustChangePassword": false
}
```

**Errors**
- 401 INVALID_CREDENTIALS — same message whether the email or the password is wrong
- 423 LOCKED_OUT — after 5 failed attempts, with retryAfterSeconds

### #2 `POST /api/auth/logout`

Signs the user out and clears the cookie.

- **Access:** Owner · **Day 1**

**Response 204 No Content**

### #3 `GET /api/auth/me`

Returns the signed-in user. The Next.js admin layout calls it to protect routes.

- **Access:** Owner · **Day 1**

**Response 200 OK**

```json
{
  "id": "a1b2c3",
  "fullName": "Owner Name",
  "email": "owner@weft.com",
  "role": "Owner",
  "mustChangePassword": false
}
```

**Errors**
- 401 Unauthorized when not signed in

### #4 `POST /api/auth/change-password`

Changes the current user's password and clears mustChangePassword.

- **Access:** Owner · **Day 1**

**Payload**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response 204 No Content**

**Rules**
- Minimum 10 characters, and not on the common-passwords list.

**Errors**
- 400 VALIDATION_FAILED


---

## 2. Storefront Catalog APIs (`/api`)

_Public, cacheable reads that power the home page, the shop and the product pages._

### #5 `GET /api/categories`

Returns the visible category tree, sorted by sortOrder.

- **Access:** Public · cache 5 min · **Day 2**

**Response 200 OK**

```json
[
  {
    "id": 1,
    "slug": "apparel",
    "nameAr": "ملابس",
    "nameEn": "Apparel",
    "imageUrl": "https://cdn…/apparel.webp",
    "sortOrder": 0,
    "children": [
      {
        "id": 7,
        "slug": "hoodies",
        "nameAr": "هوديز",
        "nameEn": "Hoodies",
        "imageUrl": null,
        "sortOrder": 0,
        "children": []
      }
    ]
  }
]
```

### #6 `GET /api/products`

Paged product list with filters, search and sorting. Only visible products in visible categories are returned.

- **Access:** Public · **Day 2**
- **Query:** `?category={slug}&q={text}&size=M&size=L&color={id}&minPrice=&maxPrice=&inStock=true&sort=newest|price_asc|price_desc|name&page=1&pageSize=20`

**Response 200 OK**

```json
{
  "items": [
    {
      "id": 12,
      "slug": "weft-essential-hoodie",
      "nameAr": "WEFT Essential Hoodie",
      "nameEn": "WEFT Essential Hoodie",
      "category": {
        "id": 3,
        "slug": "apparel",
        "nameAr": "ملابس",
        "nameEn": "Apparel"
      },
      "minPrice": 1250,
      "maxPrice": 1250,
      "image": {
        "id": 40,
        "url": "https://cdn…/12/40-800.webp",
        "srcSet": "…-400.webp 400w, …-800.webp 800w, …-1600.webp 1600w",
        "altAr": "",
        "altEn": "Front view",
        "sortOrder": 0
      },
      "colors": [
        {
          "id": 3,
          "nameAr": "كريمي",
          "nameEn": "Cream",
          "hex": "#d6b995"
        }
      ],
      "sizes": [
        "M",
        "L",
        "XL"
      ],
      "inStock": true,
      "createdAt": "2026-11-05T14:30:00Z"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 134,
  "totalPages": 7
}
```

**Rules**
- A category filter includes all of its sub-categories.
- q searches the Arabic name, English name and SKU (minimum 2 characters).
- image is the main photo (or null) and has the same shape as images[] in #7.

### #7 `GET /api/products/{slug}`

Product page: gallery, description and every variant with its price and stock.

- **Access:** Public · **Day 2**

**Response 200 OK**

```json
{
  "id": 12,
  "slug": "weft-essential-hoodie",
  "nameAr": "WEFT Essential Hoodie",
  "nameEn": "WEFT Essential Hoodie",
  "category": {
    "id": 3,
    "slug": "apparel",
    "nameAr": "ملابس",
    "nameEn": "Apparel"
  },
  "descriptionAr": "…",
  "descriptionEn": "…",
  "minPrice": 1250,
  "maxPrice": 1300,
  "inStock": true,
  "images": [
    {
      "id": 40,
      "url": "…-800.webp",
      "srcSet": "…-400.webp 400w, …-800.webp 800w, …-1600.webp 1600w",
      "altAr": "",
      "altEn": "Front view",
      "sortOrder": 0
    }
  ],
  "variants": [
    {
      "id": 501,
      "sku": "WF-1-M-CREAM",
      "size": "M",
      "color": {
        "id": 3,
        "nameAr": "كريمي",
        "nameEn": "Cream",
        "hex": "#d6b995"
      },
      "price": 1250,
      "inStock": true,
      "stock": 3
    }
  ]
}
```

**Rules**
- Public stock is null when there are more than 5 pieces; the UI shows "only N left" when 5 or fewer remain.

**Errors**
- 404 Not Found if missing or hidden

### #8 `GET /api/site-settings`

Editable home page content: announcement bar, hero, new collection, contacts and social links.

- **Access:** Public · cache 5 min · **Day 2**

**Response 200 OK**

```json
{
  "announcementAr": "توصيل لجميع المحافظات",
  "announcementEn": "Delivery across Egypt",
  "hero": {
    "titleAr": "",
    "titleEn": "",
    "subtitleAr": "",
    "subtitleEn": "",
    "imageUrl": ""
  },
  "collection": {
    "enabled": true,
    "titleAr": "الكولكشن الجديد",
    "titleEn": "New collection"
  },
  "contact": {
    "phone": "",
    "whatsApp": "",
    "email": "",
    "addressAr": "",
    "addressEn": ""
  },
  "social": {
    "facebook": "",
    "instagram": "",
    "tikTok": ""
  }
}
```

**Rules**
- Note the capitals: whatsApp and tikTok.


---

## 3. Checkout & Order Tracking APIs (`/api/orders`)

_Guest checkout with cash on delivery. The customer gets an order number and a private tracking token._

### #9 `GET /api/delivery-zones`

Lists the active governorates with their delivery fee and delivery time.

- **Access:** Public · cache 5 min · **Day 3**

**Response 200 OK**

```json
[
  {
    "id": 1,
    "key": "cairo",
    "nameAr": "القاهرة",
    "nameEn": "Cairo",
    "fee": 65,
    "etaDaysMin": 1,
    "etaDaysMax": 3
  }
]
```

### #10 `POST /api/orders`

Places a ready-made order. The server re-prices it and reserves stock in a single transaction.

- **Access:** Public · 10 per 10 min per IP · **Day 3**
- **Headers:** Idempotency-Key: <uuid> (required; a repeated key returns the original response)

**Payload**

```json
{
  "customer": {
    "name": "Mona Ahmed",
    "phone": "01012345678",
    "email": "mona@example.com",
    "deliveryZoneId": 1,
    "city": "Nasr City",
    "address": "12 Abbas El Akkad St, building 4, floor 3, apt 7",
    "notes": "Call before arrival"
  },
  "lines": [
    {
      "variantId": 501,
      "qty": 2
    }
  ],
  "paymentMethod": "CashOnDelivery",
  "expectedTotal": 1765,
  "acceptTerms": true
}
```

**Response 201 Created**

```json
{
  "number": "WF-10234",
  "trackingToken": "q8Zx…",
  "trackingUrl": "/track/WF-10234?t=q8Zx…",
  "status": "PendingConfirmation",
  "subtotal": 1700,
  "deliveryFee": 65,
  "total": 1765,
  "lines": [
    "…"
  ]
}
```

**Rules**
- Prices from the client are never trusted. The server calculates every line again.
- Stock is reserved with a concurrency token; on a conflict it retries up to 3 times.
- Email is optional. When it is given, the customer gets the confirmation and the tracking link by email; the owner is always emailed. Emails are sent after the commit.
- Validation: name 3–100, address 10–500, lines 1–30, qty 1–10, acceptTerms = true, phone is a required Egyptian mobile number, email is optional (max 254, valid format).

**Errors**
- 409 OUT_OF_STOCK — { items: [{ variantId, requested, available }] }
- 409 PRICE_CHANGED — { subtotal, deliveryFee, total } when expectedTotal no longer matches
- 400 VALIDATION_FAILED

### #11 `GET /api/orders/{number}`

Public order tracking page data. Personal data is masked.

- **Access:** Tracking token · 30/min · **Day 3**
- **Headers:** X-Tracking-Token: <token> (the UI reads it from ?t= in the page URL)

**Response 200 OK**

```json
{
  "number": "WF-10234",
  "type": "Ready",
  "status": "Shipped",
  "createdAt": "2026-11-05T14:30:00Z",
  "customer": {
    "name": "Mona A.",
    "phone": "+20101****678",
    "zone": {
      "nameAr": "القاهرة",
      "nameEn": "Cairo"
    }
  },
  "lines": [
    {
      "variantId": 501,
      "productNameAr": "WEFT Essential Hoodie",
      "productNameEn": "WEFT Essential Hoodie",
      "size": "M",
      "colorNameAr": "كريمي",
      "colorNameEn": "Cream",
      "unitPrice": 850,
      "qty": 2,
      "lineTotal": 1700,
      "imageUrl": "…-400.webp"
    }
  ],
  "subtotal": 1700,
  "deliveryFee": 65,
  "total": 1765,
  "paymentMethod": "CashOnDelivery",
  "paymentStatus": "Unpaid",
  "timeline": [
    {
      "from": null,
      "to": "PendingConfirmation",
      "at": "…"
    }
  ]
}
```

**Rules**

**Errors**
- 404 Not Found for an unknown number or a wrong token (never reveal which)


---

## 5. Admin · Category APIs (`/api/admin/categories`)

_Access: Owner. Supports two levels: main category → sub-category._

### #17 `GET /api/admin/categories`

Full tree including hidden categories, with productCount on each one.

- **Access:** Owner · **Day 2**

**Response 200 OK — CategoryNode[] + isVisible, productCount**

### #18 `POST /api/admin/categories`

Creates a main category or a sub-category.

- **Access:** Owner · **Day 2**

**Payload**

```json
{
  "parentId": null,
  "nameAr": "بناطيل كتان",
  "nameEn": "Linen Pants",
  "slug": null,
  "imageUrl": null,
  "isVisible": true,
  "sortOrder": 0
}
```

**Response 201 Created — CategoryNode**

**Rules**
- The slug is generated from nameEn when empty and must be unique.
- Maximum depth is 2. A category can't be its own parent.

**Errors**
- 409 DUPLICATE (slug)

### #19 `PUT /api/admin/categories/{id}`

Updates a category, including its parent and menu order (same body as POST).

- **Access:** Owner · **Day 2**

**Response 200 OK**

### #20 `DELETE /api/admin/categories/{id}`

Deletes an empty category.

- **Access:** Owner · **Day 2**

**Response 204 No Content**

**Errors**
- 409 IN_USE if it has products or sub-categories


---

## 6. Admin · Product APIs (`/api/admin/products`)

_Access: Owner._

### #21 `GET /api/admin/products`

Paged product table for the dashboard.

- **Access:** Owner · **Day 2**
- **Query:** `?categoryId=&q=&isVisible=&lowStock=true&sort=&page=1&pageSize=20`

**Response 200 OK**

```json
{
  "items": [
    {
      "id": 12,
      "slug": "weft-essential-hoodie",
      "nameAr": "WEFT Essential Hoodie",
      "nameEn": "WEFT Essential Hoodie",
      "categoryId": 3,
      "categoryNameAr": "ملابس",
      "categoryNameEn": "Apparel",
      "basePrice": 1250,
      "totalStock": 9,
      "variantCount": 6,
      "isVisible": true,
      "thumbnailUrl": "…-400.webp",
      "lowStock": true
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 15,
  "totalPages": 1
}
```

**Rules**
- lowStock = at least one variant has 3 pieces or fewer.

### #22 `GET /api/admin/products/{id}`

Full product for the edit form, with the real stock and version of every variant.

- **Access:** Owner · **Day 2**

**Response 200 OK — ProductDetail + isVisible**

### #23 `POST /api/admin/products`

Creates a product, optionally with its first variants.

- **Access:** Owner · **Day 2**

**Payload**

```json
{
  "categoryId": 3,
  "nameAr": "WEFT Essential Hoodie",
  "nameEn": "WEFT Essential Hoodie",
  "slug": null,
  "descriptionAr": "",
  "descriptionEn": "",
  "basePrice": 1250,
  "isVisible": true,
  "variants": [
    {
      "size": "M",
      "colorId": 3,
      "stock": 4,
      "priceOverride": null,
      "sku": null
    }
  ]
}
```

**Response 201 Created — ProductDetail**

**Errors**
- 400 VALIDATION_FAILED
- 409 DUPLICATE (slug)

### #24 `PUT /api/admin/products/{id}`

Updates the product fields, including show/hide (isVisible). Variants are managed separately.

- **Access:** Owner · **Day 2**

**Response 200 OK**

### #25 `DELETE /api/admin/products/{id}`

Deletes a product.

- **Access:** Owner · **Day 2**

**Response 204 No Content**

**Rules**
- Soft delete if the product was ever ordered (order history stays intact); otherwise a hard delete.


---

## 7. Admin · Variant APIs (`/api/admin/variants`)

_Stock is tracked per size × color._

### #26 `POST /api/admin/products/{id}/variants`

Adds a size/color combination to a product.

- **Access:** Owner · **Day 2**

**Payload**

```json
{
  "size": "L",
  "colorId": 3,
  "stock": 5,
  "priceOverride": null,
  "sku": null
}
```

**Response 201 Created — Variant**

**Rules**
- (productId, size, colorId) must be unique.
- The SKU is generated when empty: WF-{productId}-{size}-{colorKey}.

**Errors**
- 409 DUPLICATE

### #27 `PUT /api/admin/variants/{id}`

Updates size, color, stock or price.

- **Access:** Owner · **Day 2**

**Payload**

```json
{
  "size": "L",
  "colorId": 3,
  "stock": 2,
  "priceOverride": 1300,
  "version": 4182
}
```

**Response 200 OK**

**Errors**
- 409 CONCURRENCY_CONFLICT — someone else changed it; reload and try again

### #28 `DELETE /api/admin/variants/{id}`

Removes a variant (a soft delete if it was ever ordered).

- **Access:** Owner · **Day 2**

**Response 204 No Content**


---

## 8. Admin · Product Image APIs (`/api/admin/images`)

_Images are stored in Supabase Storage (public bucket product-images) as WebP 400/800/1600._

### #29 `POST /api/admin/products/{id}/images`

Uploads a product photo.

- **Access:** Owner · **Day 2**
- **Form data:** file (binary) · altAr (string) · altEn (string)

**Response 201 Created**

```json
{
  "id": 40,
  "url": "https://cdn…/12/40-800.webp",
  "srcSet": "…-400.webp 400w, …-800.webp 800w, …-1600.webp 1600w",
  "altAr": "",
  "altEn": "",
  "sortOrder": 0
}
```

**Rules**
- jpeg/png/webp only (checked by the file bytes), max 5 MB and 40 megapixels, max 10 images per product.
- The server creates 400 / 800 / 1600 px WebP versions.
- The first uploaded photo is the main photo; deleting it promotes the next one.

**Errors**
- 413 FILE_TOO_LARGE
- 415 UNSUPPORTED_FILE_TYPE
- 400 VALIDATION_FAILED when the product already has 10 images

### #30 `DELETE /api/admin/images/{id}`

Deletes an image and its stored files.

- **Access:** Owner · **Day 2**

**Response 204 No Content**


---

## 9. Admin · Color APIs (`/api/admin/colors`)

_Seeded with the 8 WEFT colours (Black, Cream, Navy, Olive, Burgundy, Gray, Blue, Pink)._

### #31 `GET /api/admin/colors`

Lists colors with usageCount.

- **Access:** Owner · **Day 2**

**Response 200 OK**

```json
[
  {
    "id": 3,
    "nameAr": "كريمي",
    "nameEn": "Cream",
    "hex": "#d6b995",
    "usageCount": 14
  }
]
```

### #32 `POST /api/admin/colors`

Adds a color.

- **Access:** Owner · **Day 2**

**Payload**

```json
{
  "nameAr": "زيتي",
  "nameEn": "Olive",
  "hex": "#727c54"
}
```

**Response 201 Created**

### #33 `PUT /api/admin/colors/{id}`

Updates a color.

- **Access:** Owner · **Day 2**

**Response 200 OK**

### #34 `DELETE /api/admin/colors/{id}`

Deletes an unused color.

- **Access:** Owner · **Day 2**

**Response 204 No Content**

**Errors**
- 409 IN_USE


---

## 10. Admin · Order APIs (`/api/admin/orders`)

_Access: Owner._

### #35 `GET /api/admin/orders`

Paged order board with filters.

- **Access:** Owner · **Day 3**
- **Query:** `?status=PendingConfirmation&status=Confirmed&q={number|phone|name}&from=&to=&page=1&pageSize=20`

**Response 200 OK**

```json
{
  "items": [
    {
      "id": 88,
      "number": "WF-10234",
      "type": "Ready",
      "status": "PendingConfirmation",
      "customerName": "Mona Ahmed",
      "phone": "+201012345678",
      "zoneNameAr": "القاهرة",
      "zoneNameEn": "Cairo",
      "total": 1765,
      "paymentStatus": "Unpaid",
      "createdAt": "…",
      "itemsCount": 2
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalCount": 1,
  "totalPages": 1
}
```

### #36 `GET /api/admin/orders/{id}`

Full order: unmasked customer data, lines, and the full status history with who made each change.

- **Access:** Owner · **Day 3**

**Response 200 OK**

### #37 `POST /api/admin/orders/{id}/status`

Moves the order to the next status.

- **Access:** Owner · **Day 3**

**Payload**

```json
{
  "to": "Confirmed",
  "note": "Confirmed by phone"
}
```

**Response 200 OK — updated order**

**Rules**
- Only the transitions in Appendix A are allowed.
- Cancelling a Ready order puts its stock back.
- Delivered sets paymentStatus = Paid automatically.

**Errors**
- 409 INVALID_STATUS_TRANSITION

## 12. Admin · Delivery Zone APIs (`/api/admin/delivery-zones`)

_Access: Owner. All 27 governorates are seeded._

### #41 `GET /api/admin/delivery-zones`

All 27 governorates, including inactive ones.

- **Access:** Owner · **Day 3**

**Response 200 OK**

### #42 `PUT /api/admin/delivery-zones`

Bulk update of fees, delivery time and active flag.

- **Access:** Owner · **Day 3**

**Payload**

```json
[
  {
    "id": 1,
    "fee": 65,
    "etaDaysMin": 1,
    "etaDaysMax": 3,
    "isActive": true
  }
]
```

**Response 200 OK**


---

## 13. Admin · Site Settings APIs (`/api/admin/site-settings`)

_Access: Owner._

### #43 `GET /api/admin/site-settings`

Current settings for the edit form.

- **Access:** Owner · **Day 4**

**Response 200 OK — same shape as #8**

### #44 `PUT /api/admin/site-settings`

Saves home page content, contacts and social links.

- **Access:** Owner · **Day 4**

**Response 200 OK**

**Rules**
- Social links must start with https://.
- WhatsApp is stored as digits with the country code.


---

## 15. Admin · Dashboard API (`/api/admin`)

### #47 `GET /api/admin/dashboard`

Home screen numbers for the admin panel.

- **Access:** Owner · **Day 4**

**Response 200 OK**

```json
{
  "ordersToday": 7,
  "pendingConfirmation": 3,
  "toPack": 4,
  "readyToShip": 5,
  "outForDelivery": 2,
  "deliveredRevenueLast30Days": 48250,
  "lowStock": [
    {
      "variantId": 501,
      "sku": "WF-1-M-BLACK",
      "productNameAr": "WEFT Essential Hoodie",
      "productNameEn": "WEFT Essential Hoodie",
      "size": "M",
      "stock": 1
    }
  ],
  "latestOrders": [
    "…5 AdminOrderRow"
  ]
}
```

**Rules**
- toPack = Confirmed · readyToShip = Packing · outForDelivery = Shipped.


---

## Health (not counted)
`GET /health` → `200 { "status": "Healthy", "db": "Healthy", "storage": "Healthy" }` · no auth · used by the uptime monitor and Docker.

---

## Appendix A — Enums & order status machine

```ts
type OrderStatus   = "PendingConfirmation" | "Confirmed" | "Packing"
                   | "Shipped" | "Delivered" | "Cancelled";
type PaymentMethod = "CashOnDelivery";           // Paymob comes in phase 2
type PaymentStatus = "Unpaid" | "Paid";
type Role          = "Owner";                    // "Staff" can be added later
type StandardSize  = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "3XL" | "FreeSize";
```

```
Order:   PendingConfirmation → Confirmed → Packing → Shipped → Delivered
Cancel:  from PendingConfirmation or Confirmed (the pieces go back to stock)
```

- Orders reserve stock at checkout; **Cancelled** puts it back.
- **Delivered** sets `paymentStatus = Paid` (cash on delivery).
- Every status change writes one `OrderStatusHistory` row.
- Anything else → `409 INVALID_STATUS_TRANSITION`.

## Appendix B — Error codes

| Status | Code | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | A field failed validation; see `errors{}` |
| 400 | `MISSING_CSRF_HEADER` | Admin mutation without `X-Requested-With` |
| 400 | `IDEMPOTENCY_KEY_REQUIRED` | `POST /api/orders` without an `Idempotency-Key` header |
| 409 | `REQUEST_IN_PROGRESS` | The same `Idempotency-Key` is still being processed |
| 422 | `IDEMPOTENCY_KEY_REUSED` | The `Idempotency-Key` was already used for a different request |
| 401 | `INVALID_CREDENTIALS` / — | Wrong login (ProblemDetails), or not signed in (empty body) |
| 404 | `NOT_FOUND` | Not found, or wrong tracking token (never says which) |
| 409 | `OUT_OF_STOCK` · `PRICE_CHANGED` · `INVALID_STATUS_TRANSITION` · `CONCURRENCY_CONFLICT` · `IN_USE` · `DUPLICATE` | Business conflicts |
| 413 | `FILE_TOO_LARGE` | Photo over 5 MB or 40 megapixels |
| 415 | `UNSUPPORTED_FILE_TYPE` | Not a real JPEG, PNG or WebP (checked by the file bytes) |
| 423 | `LOCKED_OUT` | 5 failed logins |
| 429 | — | Rate limited; empty body, read `Retry-After` (seconds) |
| 500 | — | Unexpected; only `traceId` returned |

## Appendix C — Endpoint index

| # | Method | Route | Access | Day |
|---|---|---|---|---|
| 1 | POST | `/api/auth/login` | Public | 1 |
| 2 | POST | `/api/auth/logout` | Owner | 1 |
| 3 | GET | `/api/auth/me` | Owner | 1 |
| 4 | POST | `/api/auth/change-password` | Owner | 1 |
| 5 | GET | `/api/categories` | Public | 2 |
| 6 | GET | `/api/products` | Public | 2 |
| 7 | GET | `/api/products/{slug}` | Public | 2 |
| 8 | GET | `/api/site-settings` | Public | 2 |
| 9 | GET | `/api/delivery-zones` | Public | 3 |
| 10 | POST | `/api/orders` | Public | 3 |
| 11 | GET | `/api/orders/{number}` | Tracking token | 3 |
| 17 | GET | `/api/admin/categories` | Owner | 2 |
| 18 | POST | `/api/admin/categories` | Owner | 2 |
| 19 | PUT | `/api/admin/categories/{id}` | Owner | 2 |
| 20 | DELETE | `/api/admin/categories/{id}` | Owner | 2 |
| 21 | GET | `/api/admin/products` | Owner | 2 |
| 22 | GET | `/api/admin/products/{id}` | Owner | 2 |
| 23 | POST | `/api/admin/products` | Owner | 2 |
| 24 | PUT | `/api/admin/products/{id}` | Owner | 2 |
| 25 | DELETE | `/api/admin/products/{id}` | Owner | 2 |
| 26 | POST | `/api/admin/products/{id}/variants` | Owner | 2 |
| 27 | PUT | `/api/admin/variants/{id}` | Owner | 2 |
| 28 | DELETE | `/api/admin/variants/{id}` | Owner | 2 |
| 29 | POST | `/api/admin/products/{id}/images` | Owner | 2 |
| 30 | DELETE | `/api/admin/images/{id}` | Owner | 2 |
| 31 | GET | `/api/admin/colors` | Owner | 2 |
| 32 | POST | `/api/admin/colors` | Owner | 2 |
| 33 | PUT | `/api/admin/colors/{id}` | Owner | 2 |
| 34 | DELETE | `/api/admin/colors/{id}` | Owner | 2 |
| 35 | GET | `/api/admin/orders` | Owner | 3 |
| 36 | GET | `/api/admin/orders/{id}` | Owner | 3 |
| 37 | POST | `/api/admin/orders/{id}/status` | Owner | 3 |
| 41 | GET | `/api/admin/delivery-zones` | Owner | 3 |
| 42 | PUT | `/api/admin/delivery-zones` | Owner | 3 |
| 43 | GET | `/api/admin/site-settings` | Owner | 4 |
| 44 | PUT | `/api/admin/site-settings` | Owner | 4 |
| 47 | GET | `/api/admin/dashboard` | Owner | 4 |

## Phase 2 — not built now
- AI tools: design preview image, size helper, style assistant chat, owner assistant
- Online payments (Paymob) and courier integration (Bosta)
- Employee accounts (Staff role) — the role system is already in place
- Audit log, printable packing slips, drag-and-drop reordering
