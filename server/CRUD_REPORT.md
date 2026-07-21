# CRUD REPORT — HOK Interior Designs Backend

**Date:** 2026-07-22
**Scope:** Create, Read, Update, Delete operations for every database-backed feature

---

## PORTFOLIO

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List (published) | `GET` | `/api/content/portfolio` | Public | IMPLEMENTED |
| Get single | `GET` | `/api/content/portfolio/:id` | Public | IMPLEMENTED |
| Create | `POST` | `/api/content/portfolio` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/content/portfolio/:id` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/content/portfolio/:id` | Admin | IMPLEMENTED |

**Upload:** Image (single) + gallery (up to 10 images) via `mediaService`
**Cloud storage:** Cloudinary URL stored in `imageUrl` and `mediaUrls[]` JSON
**Delete cleanup:** Cloudinary image + gallery images deleted before DB row removal

---

## PRODUCT

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List (published) | `GET` | `/api/products` | Public | IMPLEMENTED |
| Get single | `GET` | `/api/products/:id` | Public | IMPLEMENTED |
| Create | `POST` | `/api/products` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/products/:id` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/products/:id` | Admin | IMPLEMENTED |
| List all (admin) | `GET` | `/api/products/admin/all` | Admin | IMPLEMENTED |

**Upload:** Images (up to 8) via `mediaService`
**Cloud storage:** Cloudinary URLs stored in JSON `images[]` array
**Delete cleanup:** All Cloudinary image public IDs deleted before DB row removal

---

## VIRTUAL DESIGN

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List | `GET` | `/api/content/virtual-design` | Public | IMPLEMENTED |
| Get single | `GET` | `/api/content/virtual-design/:id` | Public | IMPLEMENTED |
| Create | `POST` | `/api/content/virtual-design` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/content/virtual-design/:id` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/content/virtual-design/:id` | Admin | IMPLEMENTED |

**Upload:** Main media (image or video) + gallery (up to 10, mixed types)
**Cloud storage:** Cloudinary URLs in `mediaUrl` (string) and `mediaUrls[]` (JSON with type)
**Delete cleanup:** Existing Cloudinary assets deleted before DB row removal

---

## SERVICE

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List (active) | `GET` | `/api/content/services` | Public | IMPLEMENTED |
| Get single | `GET` | `/api/content/services/:id` | Public | IMPLEMENTED |
| Create | `POST` | `/api/content/services` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/content/services/:id` | Admin | IMPLEMENTED |
| Reorder | `PATCH` | `/api/content/services/reorder` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/content/services/:id` | Admin | IMPLEMENTED |

**Upload:** Single image via `mediaService`
**Cloud storage:** Cloudinary URL in `imageUrl`, public ID in `cloudinaryId`
**Delete cleanup:** Cloudinary image deleted before DB row removal

---

## HERO

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List | `GET` | `/api/content/hero-media` | Public | IMPLEMENTED |
| Get single | `GET` | `/api/content/hero-media/:id` | Public | IMPLEMENTED |
| Create | `POST` | `/api/content/hero-media` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/content/hero-media/:id` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/content/hero-media/:id` | Admin | IMPLEMENTED |

**Upload:** Single image via `mediaService`
**Cloud storage:** Cloudinary URL in `imageUrl` and `mediaUrls[]`
**Delete cleanup:** All Cloudinary assets deleted before DB row removal

---

## ABOUT

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Get | `GET` | `/api/content/about` | Public | IMPLEMENTED |
| Upsert | `PUT` | `/api/content/about` | Admin | IMPLEMENTED |

**Upload:** Single image via `mediaService` (optional on update)
**Cloud storage:** Cloudinary URL in `aboutImageUrl`, public ID in `aboutImagePublicId`
**Delete cleanup:** Old Cloudinary image deleted if replacement is uploaded

---

## SETTINGS

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Get | `GET` | `/api/admin/settings` | Admin | IMPLEMENTED |
| Update | `PUT` | `/api/admin/settings` | Admin | IMPLEMENTED |

**Storage:** PostgreSQL text fields
**Fallback:** Returns default values if no settings row exists

---

## ORDER

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Create | `POST` | `/api/orders` | Authenticated | IMPLEMENTED |
| My orders | `GET` | `/api/orders/me` | Authenticated | IMPLEMENTED |
| List all | `GET` | `/api/orders` | Admin | IMPLEMENTED |
| Update status | `PATCH` | `/api/admin/orders/:id/status` | Admin | IMPLEMENTED |

**Storage:** PostgreSQL JSON fields (`items`, `shippingAddress`)
**Stock logic:** Product stock decremented on create, incremented on cancel

---

## MESSAGE

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Create | `POST` | `/api/messages` | Public | IMPLEMENTED |
| List | `GET` | `/api/messages` | Admin | IMPLEMENTED |
| Reply | `POST` | `/api/messages/reply` | Admin | IMPLEMENTED |

**Storage:** PostgreSQL text fields
**Email:** SendGrid notification sent on create and reply

---

## CONSULTATION

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Create | `POST` | `/api/content/consultations` | Public | IMPLEMENTED |
| List | `GET` | `/api/admin/consultations` | Admin | IMPLEMENTED |
| Export CSV | `GET` | `/api/admin/consultations/export` | Admin | IMPLEMENTED |
| Update status | `PATCH` | `/api/admin/consultations/:id/status` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/admin/consultations/:id` | Admin | IMPLEMENTED |

**Storage:** PostgreSQL text fields
**Email:** Admin notified on creation

---

## TESTIMONIAL

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| List (admin) | `GET` | `/api/admin/testimonials` | Admin | IMPLEMENTED |
| Create | `POST` | `/api/admin/testimonials` | Admin | IMPLEMENTED |
| Update | `PATCH` | `/api/admin/testimonials/:id` | Admin | IMPLEMENTED |
| Delete | `DELETE` | `/api/admin/testimonials/:id` | Admin | IMPLEMENTED |

**Upload:** Single image via `mediaService`
**Cloud storage:** Cloudinary URL in `photoUrl`, public ID in `photoPublicId`
**Delete cleanup:** Cloudinary image deleted before DB row removal

---

## USER

| Operation | Method | Route | Auth | Status |
|-----------|--------|-------|------|--------|
| Profile | `GET` | `/api/users/me` | Authenticated | IMPLEMENTED |
| Update profile | `PATCH` | `/api/users/me` | Authenticated | IMPLEMENTED |
| Cart | `GET` | `/api/users/cart` | Authenticated | IMPLEMENTED |
| Add to cart | `POST` | `/api/users/cart` | Authenticated | IMPLEMENTED |
| Update cart | `PATCH` | `/api/users/cart` | Authenticated | IMPLEMENTED |
| Remove cart item | `DELETE` | `/api/users/cart/:productId` | Authenticated | IMPLEMENTED |
| Wishlist | `GET` | `/api/users/wishlist` | Authenticated | IMPLEMENTED |
| Toggle wishlist | `POST` | `/api/users/wishlist/toggle` | Authenticated | IMPLEMENTED |

**Storage:** PostgreSQL JSON fields (`cart` on User, `products` on Wishlist)

---

## FAILURE MODES

| Operation | Failure Behavior |
|-----------|-----------------|
| Upload fails | Returns 502 with friendly message; DB transaction not started |
| Cloudinary delete fails on update | Logs error, continues with new upload |
| Cloudinary delete fails on delete | Logs error, continues with DB delete (orphaned asset) |
| DB connection lost | Returns 503; `checkDatabaseHealth()` endpoint available |
| Auth token expired | Auto-refreshes; returns 401 only if refresh fails |
| Validation fails | Returns 400 with Zod error details |
| Duplicate email on register | Returns 409 |
