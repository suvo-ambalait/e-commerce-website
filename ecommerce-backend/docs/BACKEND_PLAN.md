# MorerDokan — Backend Implementation Plan

Laravel 12 REST API for the multi-vendor marketplace frontend in `../ecommerce-frontend`.

This document is the single source of truth for building the backend. It maps every
frontend domain type, context and screen to concrete database tables, models,
endpoints, policies and services, and lays out a phased build order.

---

## 1. Context

### 1.1 What the frontend is

A React 19 + Vite + React Router SPA (`ecommerce-frontend/src`). It is a **fully
client-side prototype** today: all state lives in React context providers backed by
`localStorage` via `usePersistedState`. There is **no network layer** — no `fetch`,
`axios`, or `VITE_API_*` anywhere in `src`. Seed data lives in `src/features/*/data/*.ts`.

The backend's job is to replace those localStorage-backed contexts with a real API,
keeping the response shapes aligned with `src/shared/types/index.ts` so the frontend
migration is mostly "swap the provider internals for HTTP calls".

### 1.2 Actors / roles

From `src/shared/types` (`Role`) and `AuthContext`:

| Role       | Capabilities |
|------------|--------------|
| `customer` | Browse catalog, cart, checkout, orders, wishlist, reviews, manage own profile/addresses |
| `vendor`   | Everything a customer can, plus: own shop profile, own products, own inventory, own orders' shipments, own payouts, respond to reviews |
| `admin`    | Full platform: vendors approval, all products, categories, all orders, all inventory, customers, discounts, reviews moderation, store settings |

Demo accounts today (keep as seeded logins):
- Admin: `admin@morerdokan.example`
- Vendors: `ownerEmail` of each seed vendor (e.g. `studio@lumen.example`)

### 1.3 What already exists in this repo

- Laravel 12, PHP 8.2, MySQL (`DB_DATABASE=ecommerce-backend`)
- `laravel/sanctum` ^4, `spatie/laravel-permission` ^6.25 installed
- Migrations: default users/cache/jobs, `permission_tables`, `personal_access_tokens`,
  `vendors` (id, user_id, phone_number, status enum pending/approved/rejected),
  `shops` (id, vendor_id, name, email, logo, slug, description, address, phone_number,
  status enum pending/approved/suspended)
- Empty models `Vendor`, `Shop`; `User` has `HasApiTokens`
- `routes/api.php` has only `/user` and `/test`
- No controllers, resources, policies, form requests, factories (beyond `UserFactory`), or feature tests yet

**Decision:** the existing `vendors` + `shops` split is kept but reconciled with the
frontend's single `Vendor` shape (see §4.3). The frontend `Vendor` ≈ backend `shops`
row joined with its `vendors` + `users` rows. We treat **`shops` as the public
"vendor/studio" entity** the frontend calls a Vendor, and **`vendors` as the
seller account/onboarding record**.

### 1.4 Conventions

Follow the bundled skills when writing code:
- `laravel-best-practices` — controllers, policies, form requests, Eloquent, N+1
- `testing-best-practices` — Pest feature tests per endpoint
- `infer-conventions` — record house rules under `.ai/rules` as they solidify

House rules for this build:
- **Thin controllers**, single-purpose. Resourceful where it fits; invokable actions for the rest.
- **Form Requests** for all writes (no inline validation).
- **API Resources** for all responses — never return models directly.
- **Policies** for every authorization decision; `Gate::authorize` / `$this->authorize`.
- **Services** for multi-step domain logic (checkout, inventory, payouts).
- **Money as integer minor units** (cents) in the DB; expose decimals in Resources. Never float columns for money.
- All list endpoints paginate and support the filters the frontend already computes client-side (`useProductQuery`).
- Public read endpoints are unauthenticated; everything else is `auth:sanctum` + policy.

---

## 2. Architecture

### 2.1 Stack

- **API style:** JSON REST under `/api`, versioned `/api/v1`.
- **Auth:** Sanctum. Support **both** modes:
  - SPA cookie auth (`/sanctum/csrf-cookie` + session) for the first-party frontend.
  - Bearer personal access tokens for tooling / mobile later.
- **RBAC:** `spatie/laravel-permission` roles `customer|vendor|admin`. Assign `customer` on registration; `vendor` on shop approval; `admin` seeded.
- **IDs:** keep integer PKs internally. Expose a **stable public identifier** per resource:
  - products, shops, categories → `slug`
  - orders → `order_number` (business key, format `MSN-######`)
  - everything else → integer id is fine (internal dashboards)
  Route-model-bind on the public identifier.
- **Pagination:** Laravel length-aware paginator, `?page=`, `?per_page=` (cap 60). Resource collections include `meta`/`links`.
- **Filtering/sorting:** query-string driven, whitelisted. Consider `spatie/laravel-query-builder` (optional dependency) or hand-rolled `scopeFilter`.
- **Errors:** RFC-ish JSON `{ "message": ..., "errors": { field: [..] } }` (Laravel default). 422 validation, 403 policy, 404 binding, 409 for business conflicts (e.g. out of stock).
- **Rate limiting:** `throttle:api` global; tighter `throttle:6,1` on auth + review endpoints.

### 2.2 Packages to add

| Package | Why |
|---|---|
| `spatie/laravel-medialibrary` ^11 | product images, shop logo/banner, category image (multiple images, conversions) |
| `spatie/laravel-query-builder` ^6 | safe query-string filtering/sorting for catalog & admin lists (optional but recommended) |
| `spatie/laravel-sluggable` ^3 | auto slugs for products/shops/categories |
| `spatie/laravel-backup` ^9 | powers the `backups/` folder — DB + storage dumps (see §13) |
| `laravel/scout` + driver (later) | full-text product search for `/search` (Phase 5, optional; DB `LIKE` first) |

### 2.3 Directory layout

```
app/
  Http/
    Controllers/Api/V1/
      Auth/            RegisterController, LoginController, LogoutController, MeController
      Catalog/         ProductController, CategoryController, ReviewController
      Vendors/         ShopController, VendorApplicationController
      Cart/            CartController, CartItemController
      Checkout/        CheckoutController, DiscountPreviewController
      Orders/          OrderController, ShipmentController
      Inventory/       StockMovementController, InventoryController, CsvImportController
      Wishlist/        WishlistController
      Admin/           DashboardController, CustomerController, DiscountController,
                       SettingController, VendorAdminController, ReviewModerationController
      Vendor/          VendorDashboardController, PayoutController
    Requests/          (one per write action)
    Resources/         ProductResource, ShopResource, CategoryResource, OrderResource,
                       ShipmentResource, CartResource, ReviewResource, StockMovementResource,
                       DiscountResource, StoreSettingResource, CustomerResource, UserResource
    Middleware/        EnsureRole (thin wrapper over spatie), (Sanctum stateful is default)
  Models/
  Policies/
  Services/
    Pricing/          CartPricingService (port of shared/lib/pricing.ts)
    Checkout/         PlaceOrderService
    Inventory/        InventoryLedger (port of InventoryContext logic)
    Payouts/          PayoutCalculator (port of orders/lib/analytics.ts)
  Support/            Money (value object / cast)
database/
  migrations/
  factories/
  seeders/            + data/ ported JSON from frontend seeds
routes/
  api.php             (thin — includes route group files)
tests/Feature/Api/
docs/
  BACKEND_PLAN.md     (this file)
```

---

## 3. Money & shared calculation rules

The frontend's `calculateCartTotals` / `calculateOrderTotals`
(`src/shared/lib/pricing.ts`) is **authoritative business logic** and must be ported
verbatim to `App\Services\Pricing\CartPricingService`. Rules:

- Marketplace checkout: **each vendor ships independently**. Shipping + free-shipping
  threshold apply **per vendor shipment**, not per order.
- `discountRate` is a fraction (0.15 = 15%) applied to **each vendor subtotal**.
- Per shipment:
  - `discount   = round(subtotal * discountRate)`
  - `discountedSubtotal = subtotal - discount`
  - `shipping   = (discountedSubtotal <= 0 || discountedSubtotal >= freeShippingThreshold) ? 0 : shippingFlatRate`
  - `tax        = round(discountedSubtotal * taxRate)`
  - `total      = round(discountedSubtotal + shipping + tax)`
- Order grand totals are the **sum of shipment values**.
- `round(x)` = round half up to 2 decimals.

Rates come from **store settings** (`taxRate`, `shippingFlatRate`,
`freeShippingThreshold`, `commissionRate`, `lowStockThreshold`) — see §4.10.

Store money as **cents (unsigned integer)**. Add an `App\Support\Money` cast so models
expose `float` dollars and a `->formatted()` helper. Prices in requests accepted as
decimal strings, converted on the way in.

---

## 4. Database schema

Naming: snake_case tables, `id` bigint PK, `timestamps`, `softDeletes` where noted.
FKs `constrained()->cascadeOnDelete()` unless stated. All money columns
`unsignedInteger` cents.

### 4.1 `users`  (extend existing)

Add via new migration `add_marketplace_columns_to_users_table`:

| column | type | notes |
|---|---|---|
| `phone` | string nullable | |
| `avatar_path` | string nullable | or use medialibrary |
| (role) | — | via `model_has_roles` (spatie), not a column |

Keep default `name`, `email`, `password`, `email_verified_at`.
Relationships: `hasMany(Order)` (by email or user_id — **use `user_id` FK on orders**,
backfill guest orders to a placeholder user as the frontend does), `hasOne(Vendor)`,
`hasMany(Address)`, `hasMany(Review)`, `hasMany(WishlistItem)`, `hasOne(Cart)`.

### 4.2 `vendors`  (exists — extend)

Seller onboarding/account record. Add:

| column | type | notes |
|---|---|---|
| `status` | enum | **change** to `pending|active|suspended|rejected` to match frontend `VendorStatus` (`active|pending|suspended`) + keep `rejected` for admin flow |
| `applied_at` | timestamp nullable | |
| `approved_at` | timestamp nullable | |
| `approved_by` | FK users nullable | admin who approved |
| `payout_details` | json nullable | bank/PayPal stub for payouts screen |

`vendors.user_id` → `users`. `hasOne(Shop)`.

### 4.3 `shops`  (exists — extend to full frontend `Vendor`)

The public "studio". Frontend `Vendor` fields → columns:

| frontend `Vendor` | column | type | notes |
|---|---|---|---|
| `id` | `id` + `slug` | | expose slug |
| `slug` | `slug` | string unique | sluggable from name |
| `name` | `name` | string | exists |
| `tagline` | `tagline` | string | **add** |
| `bio` | `description` | text | exists (rename concept: bio) |
| `logo` | `logo_path` / media | string nullable | exists as `logo` |
| `banner` | `banner_path` / media | string nullable | **add** |
| `location` | `location` | string | **add** (frontend `address` maps here; keep `address` for shipping-from) |
| `rating` | `rating_cache` | decimal(2,1) default 0 | **add** — denormalized avg of product reviews |
| `reviewCount` | `review_count_cache` | unsignedInteger default 0 | **add** |
| `joinedAt` | `created_at` or `joined_at` | timestamp | use `created_at`; add `joined_at` if seed dates must be preserved |
| `status` | `status` | enum `pending|active|suspended` | exists (align values) |
| `ownerEmail` | — | derive from `vendor.user.email` | not stored on shop |
| `policies.shipping` | `policy_shipping` | text | **add** |
| `policies.returns` | `policy_returns` | text | **add** |

`shops.vendor_id` → `vendors`. `hasMany(Product)`, `hasMany(Shipment)`,
`hasManyThrough(Review, Product)`.

> Migration note: the existing `shops` migration is already committed but unmigrated in
> dev. Prefer **editing that migration** to add the new columns (before first real
> deploy) rather than stacking an `alter` migration. Same for `vendors`.

### 4.4 `categories`

Frontend `Category`: `id, name, slug, image, description`.

| column | type |
|---|---|
| `id` | bigint |
| `name` | string |
| `slug` | string unique |
| `description` | text nullable |
| `image_path` | string nullable (or media) |
| `position` | unsignedSmallInteger default 0 (admin ordering) |
| `timestamps` | |

Products reference category by **slug string today** (`product.category` is the
category *name*, e.g. `"Lighting"`). **Normalize** to `category_id` FK. Seeder maps
name → id. Keep an accessor `category` returning the name for API compatibility, plus
nest a `category` object in `ProductResource`.

### 4.5 `products`

Frontend `Product` (`src/shared/types`):

| frontend | column | type | notes |
|---|---|---|---|
| `id` | `id` + `slug` | | |
| `name` | `name` | string | |
| `slug` | `slug` | string unique | sluggable |
| `description` | `description` | text | |
| `price` | `price` | unsignedInteger (cents) | |
| `originalPrice?` | `compare_at_price` | unsignedInteger nullable | "on sale" = present & > price |
| `images[]` | medialibrary collection `images` | | fallback: `images` json of paths |
| `category` | `category_id` | FK categories | |
| `vendorId` | `shop_id` | FK shops | |
| `rating` | `rating_cache` | decimal(2,1) default 0 | denormalized |
| `reviewCount` | `review_count_cache` | unsignedInteger default 0 | denormalized |
| `stock` | `stock_on_hand` | integer default 0 | authoritative; mutated only via InventoryLedger |
| `reorderPoint?` | `reorder_point` | unsignedInteger nullable | falls back to settings.lowStockThreshold |
| `sku` | `sku` | string unique | generated `VEN-0001` style like frontend |
| `materials` | `materials` | string nullable | |
| `tags[]` | `tags` | json (array of strings) | or a `tags` + `product_tag` pivot (Phase 5) |
| `featured?` | `is_featured` | boolean default false | |
| `createdAt` | `created_at` | timestamp | |
| — | `status` | enum `draft|active|archived` default `active` | admin/vendor visibility control |
| — | `deleted_at` | softDeletes | frontend `deleteProduct` |

Indexes: `shop_id`, `category_id`, `is_featured`, `(status, created_at)`, fulltext on `name, description` (Phase 5).

Scopes: `active()`, `featured()`, `filter(array $filters)` implementing the
`useProductQuery` filter set: `categories[]` (slugs), `vendorIds[]` (shop slugs),
`tags[]`, `maxPrice`, `minRating`, `onSale`, plus sorts
`featured|new|price-asc|price-desc|rating`.

### 4.6 `product_reviews`

Frontend `Review`: `id, productId, author, rating, date, title, comment`.

| column | type | notes |
|---|---|---|
| `id` | bigint | |
| `product_id` | FK products | |
| `user_id` | FK users nullable | null for seed/guest; `author` string kept |
| `author` | string | display name |
| `rating` | unsignedTinyInteger | 1–5, validated |
| `title` | string | |
| `comment` | text | |
| `status` | enum `published|pending|hidden` default `published` | admin moderation (`AdminReviews`) |
| `vendor_response` | text nullable | `VendorReviews` reply feature |
| `vendor_responded_at` | timestamp nullable | |
| `created_at` | timestamp | frontend `date` |

On create/update/delete → recompute `products.rating_cache` / `review_count_cache`
and `shops.rating_cache` / `review_count_cache` via an observer or
`RecalculateProductRating` job.

### 4.7 `carts` + `cart_items`

Frontend `CartContext` (localStorage). Server-side cart keyed by user; guest cart
keyed by a `cart_token` cookie, merged into the user cart on login.

`carts`: `id, user_id nullable, token nullable unique, timestamps`. One open cart per owner.

`cart_items` — mirrors frontend `CartItem`:

| frontend | column |
|---|---|
| `key` | derived unique `(cart_id, product_id, size, color)` |
| `productId` | `product_id` FK |
| `vendorId` | derive from product (`shop_id`) — not stored |
| `name/price/image/category` | **not stored** — snapshot returned in Resource from product at read time; store `unit_price` cents at add-time for price-lock during checkout |
| `size` | `size` string default `'One size'` |
| `color` | `color` string default `'Natural'` |
| `quantity` | `quantity` unsignedInteger |

Server enforces `quantity <= product.stock_on_hand - committed_units` (see §11.3).

### 4.8 `orders` + `shipments` + `order_items`

Frontend `Order` / `Shipment` / `CartItem[]`.

`orders`:

| frontend | column | type |
|---|---|---|
| `orderNumber` | `order_number` | string unique, `MSN-######` |
| `email` | `email` | string (+ `user_id` FK nullable) |
| `date` | `placed_at` | timestamp |
| `shippingInfo` | `shipping_*` columns **or** `shipping_address` json | store as json snapshot of `ShippingInfo` |
| `discountCode?` | `discount_code` | string nullable |
| `subtotal/discount/shipping/tax/grandTotal` | `subtotal_cents` etc. | unsignedInteger |
| — | `payment_status` | enum `paid|pending|refunded` default `paid` (mock gateway) |
| — | `discount_rate` | decimal(5,4) — the fraction applied, for audit |

`shipments` (one per vendor per order — frontend `Shipment`):

| frontend | column |
|---|---|
| `vendorId` | `shop_id` FK |
| `items` | → `order_items` rows |
| `subtotal/shipping/tax/discount/total` | `*_cents` |
| `status` | `status` enum `Processing|Shipped|Delivered|Cancelled` (keep the frontend's capitalized values or lowercase + map in Resource) |
| — | `tracking_number` string nullable, `shipped_at`, `delivered_at` timestamps |
| — | `payout_released_at` timestamp nullable (payouts release on delivery) |

`order_items` — line snapshot (immutable):

`id, shipment_id FK, product_id FK nullable (SET NULL on product delete), product_name,
product_image, sku, unit_price_cents, quantity, size, color, line_total_cents`.

### 4.9 `stock_movements`

Direct port of frontend `StockMovement` + `InventoryContext` ledger semantics.

| frontend | column | notes |
|---|---|---|
| `id` | `id` | |
| `productId` | `product_id` FK | |
| `vendorId` | `shop_id` FK | denormalized for vendor-scoped queries |
| `delta` | `delta` integer (signed) | −3 sale, +10 restock |
| `balanceAfter` | `balance_after` integer | on-hand after applying |
| `reason` | `reason` enum | `initial|sale|return|restock|adjustment|damage|correction` |
| `note?` | `note` string nullable | |
| `actor` | `actor` string | user email or `'system'` |
| `orderNumber?` | `order_number` string nullable (+ `shipment_id` FK nullable) | links sale/return to a shipment |
| `date` | `occurred_at` timestamp | |

**Invariant:** `products.stock_on_hand` is only ever changed inside
`InventoryLedger::apply()` which writes movement rows and patches the product in one
DB transaction. Every product gets an `initial` "Opening stock" movement at creation
(the frontend backfills this in a `useEffect`; we do it in a `Product::created` observer).

### 4.10 `store_settings`

Frontend `StoreSettings` (`SettingsContext`) — single row (id=1) or key/value table.
Recommend a **single-row `store_settings` table** with a cached accessor.

| column | type | default (from frontend) |
|---|---|---|
| `store_name` | string | `MorerDokan` |
| `tagline` | string | `Considered design, many makers` |
| `contact_email` | string | `hello@morerdokan.example` |
| `contact_phone` | string | `+1 (555) 240-1998` |
| `contact_address` | string | `14 Rue des Artisans…` |
| `social_links` | json | array of `{label,url}` |
| `shipping_flat_rate_cents` | unsignedInteger | 600 |
| `free_shipping_threshold_cents` | unsignedInteger | 12000 |
| `tax_rate` | decimal(5,4) | 0.08 |
| `commission_rate` | decimal(5,4) | 0.12 |
| `low_stock_threshold` | unsignedInteger | 8 |

Cache in `Cache::rememberForever('store_settings')`, bust on update.

### 4.11 `discounts`

Frontend `Discount`: `code, discountPercent (fraction), active`.

| column | type | notes |
|---|---|---|
| `code` | string PK/unique (uppercase) | |
| `discount_percent` | decimal(5,4) | fraction, 0.15 = 15% |
| `active` | boolean default true | |
| `starts_at` / `ends_at` | timestamp nullable | future-proof; frontend has none |
| `max_redemptions` / `redemptions` | unsignedInteger nullable / default 0 | future-proof |
| `timestamps` | | |

Seed `WELCOME15` (0.15), `MAKERS10` (0.10).

### 4.12 `addresses`

Derived in frontend from order history (`AccountPage`). Give customers real saved
addresses: `id, user_id, full_name, line1, city, state, zip, country, phone,
is_default`. Checkout can save the used address here.

### 4.13 `wishlist_items`

Frontend `WishlistContext` (array of productIds). `id, user_id, product_id,
created_at`, unique `(user_id, product_id)`.

### 4.14 Entity relationship summary

```
users 1─1 vendors 1─1 shops 1─* products *─1 categories
users 1─* orders 1─* shipments 1─* order_items *─1 products
shops 1─* shipments
products 1─* product_reviews
products 1─* stock_movements
users 1─1 carts 1─* cart_items *─1 products
users 1─* addresses
users 1─* wishlist_items *─1 products
store_settings (singleton)   discounts (standalone)
```

---

## 5. Models

One model per table. Key points:

- `User` — add `HasRoles` (spatie). Helpers `isAdmin()`, `isVendor()`, `shop()` (through vendor). Cast nothing new beyond defaults.
- `Shop` — `HasSlug`, `InteractsWithMedia` (logo, banner). Appends `owner_email`, `rating`, `review_count`. Scope `active()`.
- `Vendor` — status enum cast to a PHP enum `VendorStatus`.
- `Product` — `HasSlug`, `SoftDeletes`, `InteractsWithMedia` (images). Casts: `tags => array`, `price`/`compare_at_price` => `Money`. Scopes `active()`, `featured()`, `filter()`, `sortBy()`. Appends `on_sale`, `stock_status` (`in_stock|low|out`, computed from `stock_on_hand` vs effective reorder point). `reorderPoint()` accessor with settings fallback.
- `ProductReview` — status enum cast. Observer recalculates caches.
- `Order` — `order_number` route key. Casts `shipping_address => array`, money casts. `scopeForEmail`, `scopeForShop`.
- `Shipment` — status PHP enum `ShipmentStatus`. `releasablePayout()` helper.
- `OrderItem` — immutable; no updates after create.
- `StockMovement` — `reason` enum cast; `occurred_at` datetime.
- `StoreSetting` — singleton pattern (`StoreSetting::current()`), cache-backed.
- `Discount` — `code` route key (uppercase mutator). `scopeActive()`, `isRedeemable()`.
- `Category` — `HasSlug`, `position` ordering.
- `Cart` / `CartItem` — `CartItem` computes `line_total`.
- `Address`, `WishlistItem` — plain.

PHP enums under `app/Enums/`: `Role`, `VendorStatus`, `ShopStatus`, `ProductStatus`,
`ShipmentStatus`, `StockMovementReason`, `ReviewStatus`, `PaymentStatus`.

---

## 6. Authentication & authorization

### 6.1 Endpoints (`routes/api.php`, prefix `v1`)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/sanctum/csrf-cookie` | — | SPA bootstrap (Sanctum built-in, not under `/api/v1`) |
| POST | `/v1/auth/register` | guest | name, email, password → creates user, assigns `customer`, logs in |
| POST | `/v1/auth/login` | guest | email, password → session (SPA) or token |
| POST | `/v1/auth/logout` | auth | |
| GET | `/v1/auth/me` | auth | current user + roles + `shop` summary if vendor |
| PATCH | `/v1/auth/profile` | auth | update name / phone (frontend `updateProfile`) |
| PUT | `/v1/auth/password` | auth | change password |

> The frontend `login` currently accepts any email and resolves a demo role. For the
> real backend, seed the demo accounts with a known password (e.g. `password`) and
> document it. Keep `signup` → `register`.

### 6.2 Roles & gates

- Register migration/seeder creates roles `customer`, `vendor`, `admin`.
- `admin` seeded on `admin@morerdokan.example`.
- Vendor role granted when a `VendorApplication` is approved (shop status → active).
- Middleware alias `role:admin`, `role:vendor` (spatie's `RoleMiddleware`).
- Policies do the fine-grained work (ownership checks), middleware does the coarse gate.

### 6.3 Policies

| Policy | Rules |
|---|---|
| `ProductPolicy` | `viewAny/view`: public (active only unless admin/owner). `create`: vendor or admin. `update/delete`: admin, or vendor who owns `product.shop`. |
| `ShopPolicy` | `view`: public if active, else owner/admin. `update`: owner or admin. `updateStatus`: admin only. |
| `OrderPolicy` | `view`: order owner (by user_id/email), admin, or vendor with a shipment in it. `viewAny`: admin (all) / vendor (theirs) / customer (theirs) — enforced via query scope not policy. |
| `ShipmentPolicy` | `update` (status/tracking): admin, or owning vendor. Customers cannot. |
| `ReviewPolicy` | `create`: authenticated customer who purchased the product (delivered shipment) — relax to "any authenticated" if matching current frontend. `update`: author within 24h or admin. `delete`: author or admin. `respond`: owning vendor or admin. `moderate`: admin. |
| `StockMovementPolicy` | `create`/`viewAny`: admin, or vendor for own products. |
| `CategoryPolicy` / `DiscountPolicy` / `StoreSettingPolicy` | admin only for writes; categories/settings readable publicly. |
| `CustomerPolicy` | admin only. |
| `PayoutPolicy` | vendor (own) or admin. |
| `WishlistPolicy` / `CartPolicy` / `AddressPolicy` | owner only. |

---

## 7. API surface — by frontend feature

All under `/api/v1`. **P** = public, **A** = auth, **V** = vendor, **X** = admin.
Response shapes target `src/shared/types`.

### 7.1 Catalog — `features/catalog`, `CatalogContext`

| Verb | Path | Access | Frontend caller |
|---|---|---|---|
| GET | `/products` | P | `ShopPage`, `useProductQuery` — filters: `filter[categories]`, `filter[vendorIds]`, `filter[tags]`, `filter[maxPrice]`, `filter[minRating]`, `filter[onSale]`, `sort`, `page`, `per_page` |
| GET | `/products/{slug}` | P | `ProductDetailPage` — includes shop summary, related |
| GET | `/products/{slug}/related` | P | `RelatedProducts` |
| POST | `/products` | V/X | `VendorProductForm`, `AdminProductForm` (`addProduct`) |
| PUT | `/products/{slug}` | V/X | `updateProduct` |
| PATCH | `/products/{slug}` | V/X | `patchProduct` (partial — e.g. stock, featured) |
| DELETE | `/products/{slug}` | V/X | `deleteProduct` |
| GET | `/categories` | P | `CategoriesPage`, `AdminCategories`, filter sidebars |
| GET | `/categories/{slug}` | P | category landing |
| POST/PUT/DELETE | `/categories[/{slug}]` | X | `AdminCategoryForm` |
| GET | `/products/{slug}/reviews` | P | `ReviewsSection` (`reviewsFor`) |
| POST | `/products/{slug}/reviews` | A | `addReview` |
| GET | `/deals` or `/products?filter[onSale]=1` | P | `DealsPage` |
| GET | `/search?q=` | P | `SearchPage`, `SearchDialog` — name/description/tags LIKE, later Scout |

### 7.2 Vendors / shops — `features/vendor`, `VendorContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/shops` | P | `VendorDirectoryPage` (`activeVendors`) — `?status=` for admin |
| GET | `/shops/{slug}` | P | `VendorStorefrontPage` (`getVendorBySlug`) |
| GET | `/shops/{slug}/products` | P | vendor storefront product list |
| POST | `/vendor-applications` | A | `VendorSignupPage` (`registerVendor` + `signup`) — creates vendor(pending)+shop(pending) |
| GET | `/vendor/shop` | V | `VendorProfile` — own shop |
| PUT | `/vendor/shop` | V | `VendorProfile` (`updateVendor`) — name, tagline, bio, location, policies, logo, banner |
| GET | `/admin/vendors` | X | `AdminVendors` |
| GET | `/admin/vendors/{id}` | X | `AdminVendorDetail` |
| PATCH | `/admin/vendors/{id}/status` | X | approve/suspend (`setStatus`) — flips shop status + grants/revokes vendor role |

### 7.3 Cart — `features/cart`, `CartContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/cart` | A/guest(token) | `CartPage`, header badge — returns items + `groups` (per vendor) + `subtotal` |
| POST | `/cart/items` | A/guest | `addItem` (productId, size?, color?, quantity?) |
| PATCH | `/cart/items/{id}` | A/guest | `updateQuantity` |
| DELETE | `/cart/items/{id}` | A/guest | `removeItem` |
| DELETE | `/cart` | A/guest | `clearCart` |
| POST | `/cart/merge` | A | on login, merge guest `token` cart |

`CartResource` returns `{ items: CartItem[], groups: VendorGroup[], totalItems, subtotal }`
matching `CartContextValue`.

### 7.4 Checkout & discounts — `features/checkout`, `DiscountsContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| POST | `/checkout/quote` | A/guest | live totals for cart + optional `code` — returns `CartTotals` (`calculateCartTotals`) |
| POST | `/discounts/validate` | A/guest | `findActiveDiscount` — `{ code }` → `{ valid, discountPercent }` |
| POST | `/checkout` | A/guest | `placeOrder` — body: `shippingInfo`, `payment` (mock), `discountCode?`. Server: revalidates stock, recomputes totals server-side (ignores client totals), creates order+shipments+order_items, applies `InventoryLedger` sale movements, clears cart, returns `OrderResource`. |
| GET | `/orders/{orderNumber}` | A (owner/vendor/admin) | `OrderConfirmationPage` |

**Checkout is transactional.** `PlaceOrderService::handle()`:
1. Lock cart rows / product rows `->lockForUpdate()`.
2. Re-price with `CartPricingService` using current `StoreSetting` + validated discount.
3. Assert every line `quantity <= available` (409 `{ message, unavailable: [...] }` otherwise).
4. Create `order`, per-vendor `shipments`, `order_items` (price snapshots).
5. `InventoryLedger::apply()` one `sale` movement per line (`actor='system'`, `order_number`).
6. Mock payment → `payment_status = paid`.
7. Delete cart items.
8. Dispatch `OrderPlaced` event (mail to customer + each vendor — `MAIL_MAILER=log` in dev).

### 7.5 Orders — `features/orders`, `OrdersContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/orders` | A | `AccountPage` (`ordersFor` = own by email/user) |
| GET | `/orders/{orderNumber}` | A | order detail |
| GET | `/vendor/orders` | V | `VendorOrders` (`ordersForVendor`) — flattened to shipments |
| GET | `/vendor/orders/{orderNumber}` | V | `VendorOrderDetail` — only that vendor's shipment |
| PATCH | `/vendor/shipments/{id}/status` | V | `updateShipmentStatus` — Processing→Shipped→Delivered / Cancelled |
| GET | `/admin/orders` | X | `AdminOrders` |
| GET | `/admin/orders/{orderNumber}` | X | `AdminOrderDetail` |
| PATCH | `/admin/shipments/{id}/status` | X | admin override |

**Shipment status side effects** (port `InventoryContext.reverseShipment` /
`reapplyShipment`):
- → `Cancelled`: `InventoryLedger` `return` movements (+qty back), `payout_released_at` cleared.
- `Cancelled` → active again: `sale` movements (−qty).
- → `Delivered`: set `delivered_at`, `payout_released_at = now()` (payout releases).

### 7.6 Inventory — `features/inventory`, `InventoryContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/vendor/inventory` | V | `VendorInventoryPage` — products + status + committed units |
| GET | `/vendor/inventory/{slug}` | V | `VendorInventoryDetail` — product + movement history |
| GET | `/vendor/products/{slug}/movements` | V | `StockHistory` (`movementsFor`) |
| POST | `/vendor/products/{slug}/movements` | V | `recordMovement` — `{ delta, reason, note? }` |
| PUT | `/vendor/products/{slug}/stock` | V | `setOnHand` — `{ onHand, reason, note? }` |
| POST | `/vendor/products/{slug}/receive` | V | `receive` — `{ qty, note? }` |
| POST | `/vendor/inventory/bulk-receive` | V | `bulkReceive` — `[{ slug, qty }]` |
| POST | `/vendor/inventory/import` | V | `importCsv` — multipart CSV; returns `{ updated, errors[] }` (port `parseCsv` + SKU match logic) |
| GET | `/admin/inventory` | X | `AdminInventoryPage` (all vendors) |
| GET | `/admin/inventory/{slug}` | X | `AdminInventoryDetail` |

`committed_units(product)` = sum of `order_items.quantity` where parent shipment
`status = 'Processing'` — computed in `InventoryLedger`, exposed on inventory resources.

CSV format (from `features/inventory/lib/csv.ts` — read that file when implementing):
columns include `sku`, `onHand`, `reorderPoint`. Match by SKU, produce `correction`
movements for on-hand deltas, patch `reorder_point`.

### 7.7 Payouts — `features/vendor/dashboard/VendorPayouts`, `orders/lib/analytics`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/vendor/payouts` | V | `VendorPayouts` — `summariseVendorSales` + per-shipment rows |
| GET | `/vendor/overview` | V | `VendorOverview` — KPIs, `revenueSeries`, `ordersByDay` |
| GET | `/vendor/reviews` | V | `VendorReviews` — reviews on own products |
| POST | `/vendor/reviews/{id}/response` | V | vendor reply |

`PayoutCalculator` (port `summariseVendorSales`):
- `gross      = Σ (shipment.subtotal - shipment.discount)`
- `commission = gross * settings.commissionRate`
- `net        = gross - commission`
- `pendingPayout = Σ over shipments where status = Delivered of (subtotal - discount) * (1 - commissionRate)`
- Commission rate from `StoreSetting`.

### 7.8 Admin dashboard — `features/admin`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/admin/dashboard` | X | `AdminDashboard` — totals (revenue, orders, vendors, products), `revenueSeries`, `ordersByDay`, top vendors/products, low-stock count |
| GET | `/admin/customers` | X | `AdminCustomers` — users + aggregated `orders`, `spent` |
| GET | `/admin/customers/{email}` | X | `AdminCustomerDetail` |
| GET/POST/PUT/DELETE | `/admin/discounts[/{code}]` | X | `AdminDiscounts` (`DiscountsContext`) |
| GET | `/admin/reviews` | X | `AdminReviews` — moderation queue |
| PATCH | `/admin/reviews/{id}` | X | set status `published|hidden` |
| DELETE | `/admin/reviews/{id}` | X | remove |
| GET | `/settings` | P | public store settings (name, tagline, contact, social, shipping/tax for quotes) |
| GET | `/admin/settings` | X | full settings |
| PUT | `/admin/settings` | X | `AdminSettings` (`updateSettings`) |

### 7.9 Wishlist — `features/account`, `WishlistContext`

| Verb | Path | Access | Frontend |
|---|---|---|---|
| GET | `/wishlist` | A | `WishlistPage` |
| POST | `/wishlist` | A | `toggle` (add) — `{ productId }` |
| DELETE | `/wishlist/{productId}` | A | `toggle` (remove) |
| DELETE | `/wishlist` | A | `clear` |

### 7.10 Addresses — `AccountPage`

| Verb | Path | Access |
|---|---|---|
| GET/POST/PUT/DELETE | `/addresses[/{id}]` | A (owner) |

---

## 8. API Resources (response contracts)

Each Resource mirrors the frontend TS interface so the SPA can drop them into its
existing types. Notable mappings:

- `ProductResource`: `id` → slug; `price`/`originalPrice` as numbers (dollars);
  `images` as URL array; `category` as **name string** (plus `categoryDetail` object);
  `vendorId` → shop slug; include `rating`, `reviewCount`, `stock`, `reorderPoint`,
  `sku`, `materials`, `tags`, `featured`, `createdAt` (ISO).
- `ShopResource`: full frontend `Vendor` shape incl. `policies: { shipping, returns }`,
  `ownerEmail`, `joinedAt`, `status`.
- `OrderResource` / `ShipmentResource`: exact `Order`/`Shipment` shape incl. nested
  `shipments[].items` as `CartItem`-shaped objects, all money as numbers.
- `CartResource`: `{ items, groups, totalItems, subtotal }`.
- `StockMovementResource`: `{ id, productId, vendorId, delta, balanceAfter, reason, note, actor, orderNumber, date }`.
- `StoreSettingResource`: exact `StoreSettings` shape (rates as fractions, money as numbers).
- `DiscountResource`: `{ code, discountPercent, active }`.
- `CustomerResource` (admin): `{ email, name, role, orders, spent }`.

Add a global `AppServiceProvider::boot` → `JsonResource::withoutWrapping()` **or** keep
`data` wrapping and adjust the frontend — decide once, document. Recommend **keep
`data` wrapping** for collections (pagination meta) and unwrap single resources is not
possible per-resource cleanly, so **keep wrapping everywhere** and have the frontend
API client unwrap.

---

## 9. Validation (Form Requests)

One per write. Highlights:

- `StoreProductRequest` / `UpdateProductRequest`: `name` required string; `description`
  required; `price` decimal min:0; `compare_at_price` nullable decimal gt:price;
  `category` exists:categories,slug; `materials` nullable; `tags` array of strings;
  `images` array of uploaded files (mimes:jpg,png,webp max:4096) or existing media ids;
  `stock` integer min:0 (create only — later changes go through inventory);
  `reorderPoint` nullable int min:0; `featured` boolean. `shop_id` forced from
  `auth()->user()->shop` for vendors, accepted for admin.
- `PlaceOrderRequest`: `shippingInfo.*` all required (fullName, address, city, state,
  zip, country, phone); `payment.*` required but not persisted (mock); `discountCode`
  nullable exists in active discounts.
- `StoreReviewRequest`: `rating` int 1–5; `title` required max:120; `comment` required
  max:2000; author from user.
- `RecordMovementRequest`: `delta` integer not 0; `reason` in enum; `note` nullable.
- `UpdateShipmentStatusRequest`: `status` in `ShipmentStatus`; guard illegal transitions
  in the controller/service.
- `UpdateStoreSettingRequest`: rates `numeric between:0,1`; money `numeric min:0`;
  `socialLinks` array of `{label,url}`.
- `StoreVendorApplicationRequest`: `name, ownerName, ownerEmail, location, tagline, bio`
  all required (matches `VendorSignupPage`).

---

## 10. Observers / events / jobs

| Trigger | Action |
|---|---|
| `Product::created` | write `initial` stock movement (`Opening stock`, balance = stock_on_hand) |
| `ProductReview` saved/deleted | recompute `products.rating_cache`, `review_count_cache`; then `shops` caches |
| `Shipment` status → `Delivered` | set `delivered_at`, `payout_released_at` |
| `Shipment` status → `Cancelled` | `InventoryLedger` return movements; clear payout |
| `OrderPlaced` event | `SendOrderConfirmation` (customer) + `NotifyVendorOfSale` per shop |
| `VendorApplicationApproved` | assign `vendor` role, shop → active, mail applicant |
| `StoreSetting::saved` | `Cache::forget('store_settings')` |
| Scheduled daily | `spatie/laravel-backup` run (see §13) + `backup:clean` |
| Scheduled hourly | `inventory:reconcile` — sanity-check `stock_on_hand` == last movement `balance_after` |

---

## 11. Services (ported frontend logic)

### 11.1 `CartPricingService`
Port `src/shared/lib/pricing.ts` exactly (§3). Input: array of `{ shopId, subtotalCents }`,
`discountРate`, rates from settings. Output: `CartTotals` with per-shipment breakdown.
Add a Pest test that mirrors the frontend numbers from `seedOrders.ts`.

### 11.2 `PlaceOrderService`
See §7.4. Transactional, authoritative pricing, stock guard, ledger writes.

### 11.3 `InventoryLedger`
Port `InventoryContext`:
- `apply(array $entries)` — one transaction: for each `{ productId, delta, reason, note?, orderNumber?, actor? }`,
  lock product, compute `balance_after`, insert movement, update `stock_on_hand`.
  Skip `delta == 0`. Clamp on-hand at ≥ 0 for `setOnHand`.
- `committedUnits(product)` — Processing shipments only.
- `receive`, `bulkReceive`, `setOnHand`, `applyOrderSale(order)`, `reverseShipment`,
  `reapplyShipment`, `importCsv(string)`.
- `statusFor(product)` → `in_stock|low|out` using `reorder_point ?? settings.low_stock_threshold`
  (port `features/inventory/lib/status.ts`).

### 11.4 `PayoutCalculator`
Port `summariseVendorSales` / `vendorShipments` / `revenueSeries` / `ordersByDay` from
`features/orders/lib/analytics.ts`. Note the frontend adds a **seeded synthetic
baseline** to charts — the backend should return **real data only**; the frontend can
keep or drop its baseline. Document this difference.

---

## 12. Seeders

Port every frontend seed file so a fresh `migrate:fresh --seed` reproduces today's demo.

| Seeder | Source | Notes |
|---|---|---|
| `RoleSeeder` | — | customer, vendor, admin |
| `StoreSettingSeeder` | `SettingsContext` defaults | id=1 row |
| `DiscountSeeder` | `DiscountsContext` | WELCOME15, MAKERS10 |
| `CategorySeeder` | `features/catalog/data/categories.ts` | 8 categories, keep slugs |
| `UserSeeder` | `AuthContext` + vendor `ownerEmail`s | admin + 7 vendor owners + a few customers (`jordan@example.com`, `priya@example.com` from seedOrders). Password `password`. |
| `VendorShopSeeder` | `features/vendor/data/vendors.ts` | 7 shops; preserve `joinedAt`, `status` (Fern & Flora = pending), `policies`, `tagline`, `location`. Grant `vendor` role to active shop owners. |
| `ProductSeeder` | `features/catalog/data/products.ts` | 42 products; map `vendorId`→shop, `category` name→id, keep `sku` scheme, `createdAt`, `featured`, `stock`. Fire `Product::created` for opening-stock movements (or seed movements explicitly). |
| `StockMovementSeeder` | `features/inventory/data/seedMovements.ts` | read that file; align with product opening stock |
| `ReviewSeeder` | `features/catalog/data/reviews.ts` | recompute caches after |
| `OrderSeeder` | `features/orders/data/seedOrders.ts` | 3 historical orders (MSN-004821/004796/004752) with exact shipment splits, statuses, totals, discount code on 004796. Do **not** re-run inventory sale movements for these if `seedMovements` already accounts for them — reconcile. |

Images: seeders can store remote placeholder URLs (frontend `image.ts` uses a
deterministic image service) directly in `images` json / media `custom_properties`
rather than downloading — Phase 1. Real uploads via medialibrary from Phase 2.

Factories for every model for tests (`ProductFactory`, `ShopFactory`, `OrderFactory`
with `->withShipments()`, `ReviewFactory`, etc.).

---

## 13. Backups (`backups/` folder)

The `backups/` directory (created alongside this plan, git-ignored via
`backups/.gitignore` and the root `.gitignore`) is the local target for
`spatie/laravel-backup`.

Setup:
1. `composer require spatie/laravel-backup`
2. `php artisan vendor:publish --tag=backup-config`
3. In `config/backup.php`:
   - `backup.name` → `morerdokan`
   - `backup.source.files.include` → `base_path('storage/app/public')` (uploaded media), `base_path('.env')` optional
   - `backup.source.databases` → `['mysql']`
   - `backup.destination.disks` → a `backups` disk
4. In `config/filesystems.php` add:
   ```php
   'backups' => [
       'driver' => 'local',
       'root'   => base_path('backups'),
       'throw'  => false,
   ],
   ```
5. `routes/console.php` (Laravel 12 scheduler):
   ```php
   Schedule::command('backup:clean')->daily()->at('01:00');
   Schedule::command('backup:run')->daily()->at('01:30');
   ```
6. Retention in `config/backup.php` → `cleanup.default_strategy` keep 7 daily / 4 weekly.
7. Production: add an off-box disk (S3) to `destination.disks` too — never rely on the
   local `backups/` folder alone.

Manual: `php artisan backup:run`. Restore: unzip the archive from `backups/morerdokan/`,
`mysql < db-dump.sql`, restore media.

Also add a lightweight `db:snapshot` custom command for dev (mysqldump →
`backups/dev/{timestamp}.sql`) if the full package feels heavy early on.

---

## 14. Testing

Pest feature tests per endpoint group under `tests/Feature/Api/V1/`. Follow
`testing-best-practices`. Minimum coverage:

- **Auth:** register assigns customer role; login/logout; `me` shape; profile update.
- **Catalog:** product list filters (each of categories/vendorIds/tags/maxPrice/minRating/onSale) and each sort; slug 404; only `active` products shown publicly; vendor sees own drafts.
- **Product writes:** vendor can only CRUD own shop's products; admin any; validation.
- **Reviews:** create updates caches; rating math; moderation hides from public list.
- **Cart:** add/update/remove/clear; guest token → merge on login; quantity vs stock guard.
- **Checkout:** happy path creates order+shipments+items+sale movements, clears cart; server re-prices (ignores tampered client totals); out-of-stock → 409, no side effects (transaction rolls back); discount code applied per vendor; totals match `CartPricingService` and the `seedOrders` reference numbers.
- **Orders:** customer sees only theirs; vendor sees only shipments they own; admin sees all.
- **Shipment status:** legal transitions only; Cancelled restocks (return movements); Delivered releases payout; re-activation re-applies sale.
- **Inventory:** ledger `balance_after` correctness across a sequence; `committedUnits`; `setOnHand` clamp; CSV import updated/errors counts; every new product gets an opening movement.
- **Payouts:** `PayoutCalculator` matches `summariseVendorSales` for seeded data; commission uses settings rate.
- **Admin:** vendor approval grants role + activates shop; settings update busts cache and changes checkout quotes; discount CRUD.
- **Policies:** 403 matrix — customer hitting vendor/admin routes, vendor hitting other vendor's data.

CI: `composer test` (already wired). Add `pest --coverage` gate later.

---

## 15. Phased roadmap

Each phase ends with green tests and a usable slice.

**Phase 0 — Foundations**
- Enums, `Money` support, `store_settings` + seeder + cached accessor, roles seeder.
- Sanctum SPA config (`config/cors.php`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`).
- `routes/api.php` split into grouped files; `/api/v1` prefix; base Resource wrapping decision.
- Reconcile `vendors` + `shops` migrations (add columns per §4.2–4.3).

**Phase 1 — Catalog read + seed parity**
- Migrations + models: categories, products, product_reviews, shops (public read).
- Seeders: categories, users, vendors/shops, products, reviews (parity with frontend `migrate:fresh --seed`).
- Endpoints: `GET /products`, `/products/{slug}`, `/categories`, `/shops`, `/shops/{slug}`, `/products/{slug}/reviews`, `/search`.
- Resources matching TS types. Frontend can now read from the API.

**Phase 2 — Auth + customer writes**
- Register/login/logout/me/profile.
- Reviews create; wishlist; addresses.
- Server cart (`/cart` + items) with guest token + merge.

**Phase 3 — Checkout + orders**
- `CartPricingService`, `PlaceOrderService`, `InventoryLedger` (sale path).
- `/checkout/quote`, `/discounts/validate`, `/checkout`, `/orders`, `/orders/{n}`.
- `OrderSeeder`, `StockMovementSeeder`. Order confirmation.

**Phase 4 — Vendor dashboard**
- Product CRUD (vendor-scoped) + media uploads.
- `/vendor/shop` profile, vendor applications + admin approval.
- `/vendor/orders`, shipment status transitions + inventory side effects.
- Inventory endpoints (movements, receive, bulk, CSV import), `/vendor/inventory`.
- `/vendor/payouts`, `/vendor/overview`, `/vendor/reviews` + responses.
- `PayoutCalculator`, analytics endpoints.

**Phase 5 — Admin + polish**
- `/admin/dashboard`, `/admin/customers`, `/admin/vendors`, `/admin/orders`, `/admin/inventory`.
- `/admin/discounts`, `/admin/reviews` moderation, `/admin/settings`.
- Category CRUD.
- `spatie/laravel-backup` wired to `backups/` + schedule (§13).
- Optional: Scout search, `product_tag` pivot, rate-limit tuning, OpenAPI doc (`dedoc/scramble`).

**Phase 6 — Frontend integration**
- Add `VITE_API_URL` + a typed `apiClient` (fetch wrapper, CSRF, error mapping).
- Replace each context's localStorage internals with React Query + API calls, keeping
  the same context value shape so components don't change.
- Delete `src/features/*/data/*.ts` seeds (or keep for Storybook/tests).

---

## 16. Frontend changes required (Phase 6 checklist)

| Frontend file | Change |
|---|---|
| `src/shared/lib/storage.ts` + `usePersistedState` | keep only for genuinely local UI state (theme, filters); stop using for domain data |
| `features/auth/context/AuthContext.tsx` | `login/signup/logout` → `/auth/*`; store nothing but the user; rely on Sanctum cookie |
| `features/catalog/context/CatalogContext.tsx` | products/categories/reviews from API; `useProductQuery` filters become query params (server-side) |
| `features/cart/context/CartContext.tsx` | proxy to `/cart`; keep `groups`/`subtotal` selectors client-side or take from `CartResource` |
| `features/checkout/pages/CheckoutPage.tsx` | `placeOrder` → `POST /checkout`; drop client-side `applyOrderSale` (server does it) |
| `features/orders/context/OrdersContext.tsx` | `/orders`, `/vendor/orders`; `updateShipmentStatus` → PATCH |
| `features/inventory/context/InventoryContext.tsx` | all mutators → inventory endpoints; drop the opening-stock `useEffect` |
| `features/admin/context/SettingsContext.tsx` | `/settings` + `/admin/settings` |
| `features/admin/context/DiscountsContext.tsx` | `/admin/discounts` + `/discounts/validate` |
| `features/vendor/context/VendorContext.tsx` | `/shops`, `/vendor/shop`, `/vendor-applications`, `/admin/vendors/{id}/status` |
| `features/account/context/WishlistContext.tsx` | `/wishlist` |
| new `src/shared/api/client.ts` | fetch wrapper: base URL, credentials, CSRF cookie, 422→field errors, 401→redirect login |
| `.env` / `vite.config.ts` | `VITE_API_URL`, dev proxy to `http://localhost:8000` |

---

## 17. Open decisions (confirm before/during build)

1. **Resource wrapping:** keep Laravel's `data` wrapper everywhere (recommended) vs unwrap. → affects the frontend API client.
2. **Review gating:** require verified purchase (delivered shipment) vs any authenticated user (matches current frontend). Recommend: any authenticated for parity now, add a `verified_purchase` flag.
3. **Guest checkout:** keep it (frontend allows it) — orders get a placeholder user by email. Confirm.
4. **Order identity:** match by `user_id` (recommended, with email fallback for guest) vs email only (frontend behavior).
5. **IDs in URLs:** slugs for catalog (recommended) vs opaque ids. Slug changes on rename — add redirects or freeze slug after first publish.
6. **Payments:** mock gateway now (`payment_status=paid`), real Stripe later — leave a `PaymentGateway` interface seam in `PlaceOrderService`.
7. **Media:** medialibrary + local disk now, S3 in production. Seed with remote placeholder URLs vs download-on-seed.
8. **Charts baseline:** backend returns real series only; decide if the frontend keeps its synthetic baseline.

---

*Generated as the implementation blueprint. Update this file as decisions are locked
and phases land; record crystallized conventions under `.ai/rules`.*
