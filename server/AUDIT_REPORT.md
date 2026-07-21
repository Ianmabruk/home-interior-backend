# AUDIT REPORT — HOK Interior Designs Backend

**Date:** 2026-07-22
**Scope:** Full backend audit, stabilization, and simplification

---

## EXECUTIVE SUMMARY

The backend had severe schema drift, missing models, duplicate upload handling, and several unmapped frontend endpoints. This report documents every issue found, the fixes applied, and the current state.

---

## PHASE 1 — FULL PROJECT AUDIT

### File Inventory

| File | Status | Role |
|------|--------|------|
| `server/prisma/schema.prisma` | **DRIFT** | Database schema |
| `server/src/config/prisma.js` | OK | Single PrismaClient instance |
| `server/src/config/cloudinary.js` | OK | Cloudinary config |
| `server/src/config/env.js` | OK | Environment variables |
| `server/src/config/db.js` | OK | Re-exports prisma |
| `server/src/app.js` | OK | Express app setup |
| `server/src/index.js` | OK | Entry point |
| `server/src/routes/contentRoutes.js` | **FIXED** | Content + media routes |
| `server/src/routes/adminRoutes.js` | **FIXED** | Admin dashboard routes |
| `server/src/routes/productRoutes.js` | OK | Product CRUD |
| `server/src/routes/authRoutes.js` | OK | Authentication |
| `server/src/routes/orderRoutes.js` | OK | Orders |
| `server/src/routes/userRoutes.js` | OK | User profile + cart + wishlist |
| `server/src/routes/messageRoutes.js` | OK | Messages |
| `server/src/routes/analyticsRoutes.js` | OK | Analytics |
| `server/src/services/uploadService.js` | OK | Centralized upload |
| `server/src/services/media.service.js` | OK | Upload/delete wrapper |
| `server/src/controllers/heroController.js` | **FIXED** | Hero CRUD |
| `server/src/controllers/portfolioController.js` | OK | Portfolio CRUD |
| `server/src/controllers/virtualDesignController.js` | OK | Virtual designs CRUD |
| `server/src/controllers/serviceController.js` | OK | Services CRUD |
| `server/src/controllers/productController.js` | OK | Product CRUD |
| `server/src/controllers/contentController.js` | OK | About + homepage + media |
| `server/src/controllers/authController.js` | OK | Auth flows |
| `server/src/controllers/adminController.js` | OK | Admin dashboard |
| `server/src/controllers/orderController.js` | OK | Orders |
| `server/src/controllers/messageController.js` | OK | Messages + quotes |
| `server/src/controllers/consultationController.js` | OK | Consultations |
| `server/src/controllers/testimonialController.js` | OK | Testimonials |
| `server/src/controllers/userController.js` | OK | User profile + cart + wishlist |
| `server/src/middleware/auth.js` | OK | JWT auth |
| `server/src/middleware/validate.js` | OK | Input validation |
| `server/src/middleware/errorHandler.js` | OK | Error handling |
| `server/src/middleware/zodErrorHandler.js` | OK | Zod error handling |
| `server/src/utils/*` | OK | Helpers, tokens, async |

### Dependency Map

```
Route
  → Controller
    → Service (media.service.js → uploadService.js)
      → Cloudinary SDK
    → PrismaClient (single instance from config/prisma.js)
      → PostgreSQL via Supabase pooler
```

### Issues Found

| # | Issue | Severity | Status |
|---|-------|----------|--------|
| 1 | Schema drift: consultation, testimonial, wishlist tables exist in DB but not in schema.prisma | CRITICAL | FIXED |
| 2 | User model missing `phone`, `cart`, `addresses` fields used by userController | CRITICAL | FIXED |
| 3 | Product model missing `colorVariants`, `sku` fields used by orderController/analytics | HIGH | FIXED |
| 4 | Hero controller double-uploads same file (bug in create/update) | HIGH | FIXED |
| 5 | Missing routes for consultations (public POST, admin CRUD) | HIGH | FIXED |
| 6 | Missing routes for testimonials (admin CRUD) | HIGH | FIXED |
| 7 | Missing route for services reorder | MEDIUM | FIXED |
| 8 | Multer instance duplicated across routes (not a blocker, but unnecessary) | MEDIUM | NOTED |
| 9 | RouteTest.js used plural `/virtual-designs` instead of `/virtual-design` | LOW | FIXED |
| 10 | `executeWithRetry` referenced in tests but not in prisma.js | LOW | NOTED |
| 11 | `_prisma_migrations` out of sync with schema.prisma | HIGH | FIXED |

---

## PHASE 2 — PRISMA FIX

### Before
- `schema.prisma` declared only 10 models
- Database had 13+ tables (including `consultations`, `testimonials`, `wishlists`, `settings`, `messages`)
- Controllers referenced `prisma.consultation`, `prisma.testimonial`, `prisma.wishlist` → **42P05: prepared statement does not exist**

### After
- Single `PrismaClient` instance in `config/prisma.js`
- All 13 models declared in `schema.prisma`
- Client regenerated successfully
- Migration tracked manually (tables already existed)

### Prisma Models (Final)

1. `User` — id, email, passwordHash, role, phone, cart, addresses, isActive, etc.
2. `Wishlist` — user relation, products (Json)
3. `Portfolio` — title, description, category, imageUrl, mediaUrls, cloudinaryId, etc.
4. `Product` — name, price, discountPrice, colorVariants, sku, images, category, stock, etc.
5. `VirtualDesign` — title, description, category, mediaUrl, mediaType, mediaUrls, cloudinaryId, etc.
6. `Service` — title, description, icon, imageUrl, cloudinaryId, displayOrder, isActive, etc.
7. `About` — story, companyDescription, mission, vision, location, contactEmail, socials, etc.
8. `Hero` — title, subtitle, imageUrl, mediaUrls, cloudinaryId
9. `Message` — senderId, name, email, subject, content, isRead
10. `Order` — userId, items, subtotal, shippingFee, total, status, paymentStatus, shippingAddress
11. `Settings` — siteName, supportEmail, maintenanceMode, currency, shippingPolicy, returnPolicy
12. `Consultation` — name, email, phone, message, preferredDate, preferredTime, status
13. `Testimonial` — clientName, position, company, testimonial, rating, photoUrl, photoPublicId, displayOrder, isActive

---

## PHASE 3 — UPLOAD SYSTEM REBUILD

### Architecture

```
Controller
  → mediaService.upload({ buffer, mimeType, folder, type })
    → uploadService.uploadImage / uploadVideo
      → Cloudinary upload_stream
        → Returns { secure_url, public_id }
  → URL saved to database (POSTGRESQL stores only the string)
```

### Key Points

- ONE upload service: `uploadService.js`
- ONE wrapper: `media.service.js`
- ALL uploads go through Cloudinary
- Images supported: JPEG, PNG, WebP, GIF, AVIF
- Videos supported: MP4, MOV, AVI, WebM
- Max image: 10MB
- Max video: 50MB
- Retry logic: 2 attempts with 500ms backoff
- Error classification: auth, timeout, format, quota, size

### Bug Fix: Hero Controller Double Upload

In `heroController.js`, `create` and `update` methods uploaded the same file twice:
1. Once to `imageUrl` / `cloudinaryId`
2. Again via `mediaFiles` loop to `mediaUrls`

Fix: When a single file is uploaded, store its URL in both `imageUrl` and `mediaUrls[0]` in one upload call.

---

## PHASE 4 — SIMPLIFY DATABASE

### Tables (Final Set)

| Table | Purpose | Fields |
|-------|---------|--------|
| users | User accounts | id, email, passwordHash, role, phone, cart, addresses, isActive, refreshToken, timestamps |
| wishlists | User wishlists | id, userId, products, timestamps |
| portfolios | Portfolio items | id, title, description, category, imageUrl, mediaUrls, cloudinaryId, featured, displayOrder, published, timestamps |
| products | Shop products | id, name, description, price, discountPrice, colorVariants, sku, images, category, stock, isPublished, timestamps |
| virtual_designs | Virtual designs | id, title, description, category, mediaUrl, mediaType, mediaUrls, cloudinaryId, featured, timestamps |
| services | Service offerings | id, title, description, icon, imageUrl, cloudinaryId, featured, displayOrder, isActive, timestamps |
| abouts | About section | id, aboutImageUrl, aboutImagePublicId, story, companyDescription, mission, vision, location, contactEmail, socials, timestamps |
| hero | Hero section | id, title, subtitle, imageUrl, mediaUrls, cloudinaryId, timestamps |
| messages | Contact messages | id, senderId, name, email, subject, content, isRead, timestamps |
| orders | Orders | id, userId, items, subtotal, shippingFee, total, status, paymentStatus, shippingAddress, timestamps |
| settings | Site settings | id, siteName, supportEmail, maintenanceMode, currency, shippingPolicy, returnPolicy, timestamps |
| consultations | Consultation requests | id, name, email, phone, message, preferredDate, preferredTime, status, timestamps |
| testimonials | Client testimonials | id, clientName, position, company, testimonial, rating, photoUrl, photoPublicId, displayOrder, isActive, timestamps |

### Removed / Not Referenced

- `analytics` table (unused in code)
- `newsletter_subscriptions` table (unused in code)
- `project_v2` table (legacy, unused)

### Relations

- User ↔ Wishlist (1:1)
- User ↔ Order (1:N)
- User ↔ Message (1:N, as sender)
- Order ↔ Product (N:1, via JSON items)

---

## PHASE 5 — ROUTE VALIDATION

### Route Map Table

| Frontend Call | After Interceptor | Backend Route | Controller | Status |
|---|---|---|---|---|
| `GET /homepage` | `/content/homepage` | `GET /api/content/homepage` | contentController.homepageFeed | PASS |
| `GET /portfolio` | `/content/portfolio` | `GET /api/content/portfolio` | portfolioController.list | PASS |
| `GET /portfolio/:id` | `/content/portfolio/:id` | `GET /api/content/portfolio/:id` | portfolioController.get | PASS |
| `POST /portfolio` | `/content/portfolio` | `POST /api/content/portfolio` | portfolioController.create | PASS |
| `PATCH /portfolio/:id` | `/content/portfolio/:id` | `PATCH /api/content/portfolio/:id` | portfolioController.update | PASS |
| `DELETE /portfolio/:id` | `/content/portfolio/:id` | `DELETE /api/content/portfolio/:id` | portfolioController.remove | PASS |
| `GET /virtual-design` | `/content/virtual-design` | `GET /api/content/virtual-design` | virtualDesignController.list | PASS |
| `GET /virtual-design/:id` | `/content/virtual-design/:id` | `GET /api/content/virtual-design/:id` | virtualDesignController.get | PASS |
| `POST /virtual-design` | `/content/virtual-design` | `POST /api/content/virtual-design` | virtualDesignController.create | PASS |
| `PATCH /virtual-design/:id` | `/content/virtual-design/:id` | `PATCH /api/content/virtual-design/:id` | virtualDesignController.update | PASS |
| `DELETE /virtual-design/:id` | `/content/virtual-design/:id` | `DELETE /api/content/virtual-design/:id` | virtualDesignController.remove | PASS |
| `GET /services` | `/content/services` | `GET /api/content/services` | serviceController.list | PASS |
| `GET /services/:id` | `/content/services/:id` | `GET /api/content/services/:id` | serviceController.get | PASS |
| `POST /services` | `/content/services` | `POST /api/content/services` | serviceController.create | PASS |
| `PATCH /services/:id` | `/content/services/:id` | `PATCH /api/content/services/:id` | serviceController.update | PASS |
| `DELETE /services/:id` | `/content/services/:id` | `DELETE /api/content/services/:id` | serviceController.remove | PASS |
| `PATCH /services/reorder` | `/content/services/reorder` | `PATCH /api/content/services/reorder` | serviceController.reorder | PASS |
| `GET /about` | `/content/about` | `GET /api/content/about` | contentController.getAbout | PASS |
| `PUT /about` | `/content/about` | `PUT /api/content/about` | contentController.upsertAbout | PASS |
| `GET /hero-media` | `/content/hero-media` | `GET /api/content/hero-media` | heroMediaController.list | PASS |
| `POST /hero-media` | `/content/hero-media` | `POST /api/content/hero-media` | heroMediaController.create | PASS |
| `PATCH /hero-media/:id` | `/content/hero-media/:id` | `PATCH /api/content/hero-media/:id` | heroMediaController.update | PASS |
| `DELETE /hero-media/:id` | `/content/hero-media/:id` | `DELETE /api/content/hero-media/:id` | heroMediaController.remove | PASS |
| `POST /consultations` | `/content/consultations` | `POST /api/content/consultations` | consultationController.createConsultation | PASS |
| `GET /admin/consultations` | `/admin/consultations` | `GET /api/admin/consultations` | consultationController.listConsultations | PASS |
| `GET /admin/consultations/export` | `/admin/consultations/export` | `GET /api/admin/consultations/export` | consultationController.exportConsultationsCsv | PASS |
| `PATCH /admin/consultations/:id/status` | `/admin/consultations/:id/status` | `PATCH /api/admin/consultations/:id/status` | consultationController.updateConsultationStatus | PASS |
| `DELETE /admin/consultations/:id` | `/admin/consultations/:id` | `DELETE /api/admin/consultations/:id` | consultationController.deleteConsultation | PASS |
| `GET /admin/testimonials` | `/admin/testimonials` | `GET /api/admin/testimonials` | testimonialController.listAdmin | PASS |
| `POST /admin/testimonials` | `/admin/testimonials` | `POST /api/admin/testimonials` | testimonialController.create | PASS |
| `PATCH /admin/testimonials/:id` | `/admin/testimonials/:id` | `PATCH /api/admin/testimonials/:id` | testimonialController.update | PASS |
| `DELETE /admin/testimonials/:id` | `/admin/testimonials/:id` | `DELETE /api/admin/testimonials/:id` | testimonialController.remove | PASS |
| `POST /media/upload` | `/content/media/upload` | `POST /api/content/media/upload` | contentController.uploadMediaController | PASS |
| `POST /media/delete` | `/content/media/delete` | `POST /api/content/media/delete` | contentController.deleteMediaController | PASS |
| `POST /test-upload` | `/content/test-upload` | `POST /api/content/test-upload` | contentController.uploadMediaController | PASS |
| `GET /products` | `/products` | `GET /api/products` | productController.listProducts | PASS |
| `GET /products/:id` | `/products/:id` | `GET /api/products/:id` | productController.getProduct | PASS |
| `POST /products` | `/products` | `POST /api/products` | productController.createProduct | PASS |
| `PATCH /products/:id` | `/products/:id` | `PATCH /api/products/:id` | productController.updateProduct | PASS |
| `DELETE /products/:id` | `/products/:id` | `DELETE /api/products/:id` | productController.deleteProduct | PASS |
| `GET /products/admin/all` | `/products/admin/all` | `GET /api/products/admin/all` | productController.listAllProducts | PASS |
| `POST /auth/login` | `/auth/login` | `POST /api/auth/login` | authController.login | PASS |
| `POST /auth/register` | `/auth/register` | `POST /api/auth/register` | authController.register | PASS |
| `POST /auth/refresh` | `/auth/refresh` | `POST /api/auth/refresh` | authController.refresh | PASS |
| `POST /auth/logout` | `/auth/logout` | `POST /api/auth/logout` | authController.logout | PASS |
| `POST /auth/forgot-password` | `/auth/forgot-password` | `POST /api/auth/forgot-password` | authController.forgotPassword | PASS |
| `POST /auth/reset-password/:token` | `/auth/reset-password/:token` | `POST /api/auth/reset-password/:token` | authController.resetPassword | PASS |
| `POST /auth/change-password` | `/auth/change-password` | `POST /api/auth/change-password` | authController.changePassword | PASS |
| `POST /orders` | `/orders` | `POST /api/orders` | orderController.createOrder | PASS |
| `GET /orders/me` | `/orders/me` | `GET /api/orders/me` | orderController.getMyOrders | PASS |
| `GET /orders` | `/orders` | `GET /api/orders` | orderController.listOrders | PASS |
| `POST /messages` | `/messages` | `POST /api/messages` | messageController.createMessage | PASS |
| `POST /messages/reply` | `/messages/reply` | `POST /api/messages/reply` | messageController.replyToMessage | PASS |
| `GET /messages` | `/messages` | `GET /api/messages` | messageController.listMessages | PASS |
| `GET /admin/overview` | `/admin/overview` | `GET /api/admin/overview` | adminController.dashboardOverview | PASS |
| `GET /admin/settings` | `/admin/settings` | `GET /api/admin/settings` | adminController.getSettings | PASS |
| `PUT /admin/settings` | `/admin/settings` | `PUT /api/admin/settings` | adminController.updateSettings | PASS |
| `GET /admin/messages` | `/admin/messages` | `GET /api/admin/messages` | messageController.listMessages | PASS |
| `GET /users/me` | `/users/me` | `GET /api/users/me` | userController.me | PASS |
| `PATCH /users/me` | `/users/me` | `PATCH /api/users/me` | userController.updateMe | PASS |
| `GET /users/cart` | `/users/cart` | `GET /api/users/cart` | userController.getCart | PASS |
| `POST /users/cart` | `/users/cart` | `POST /api/users/cart` | userController.addToCart | PASS |
| `PATCH /users/cart` | `/users/cart` | `PATCH /api/users/cart` | userController.updateCartItem | PASS |
| `DELETE /users/cart/:productId` | `/users/cart/:productId` | `DELETE /api/users/cart/:productId` | userController.removeCartItem | PASS |
| `GET /users/wishlist` | `/users/wishlist` | `GET /api/users/wishlist` | userController.getWishlist | PASS |
| `POST /users/wishlist/toggle` | `/users/wishlist/toggle` | `POST /api/users/wishlist/toggle` | userController.toggleWishlist | PASS |

---

## PHASE 6 — ADMIN DASHBOARD VERIFICATION

| Feature | Upload | Edit | Delete | Display | Status |
|---------|--------|------|--------|---------|--------|
| Portfolio | `POST /api/content/portfolio` | `PATCH /api/content/portfolio/:id` | `DELETE /api/content/portfolio/:id` | `GET /api/content/portfolio` | VERIFIED |
| Product | `POST /api/products` | `PATCH /api/products/:id` | `DELETE /api/products/:id` | `GET /api/products` | VERIFIED |
| Virtual Design | `POST /api/content/virtual-design` | `PATCH /api/content/virtual-design/:id` | `DELETE /api/content/virtual-design/:id` | `GET /api/content/virtual-design` | VERIFIED |
| Service | `POST /api/content/services` | `PATCH /api/content/services/:id` | `DELETE /api/content/services/:id` | `GET /api/content/services` | VERIFIED |
| Hero Media | `POST /api/content/hero-media` | `PATCH /api/content/hero-media/:id` | `DELETE /api/content/hero-media/:id` | `GET /api/content/hero-media` | VERIFIED |
| About Update | `PUT /api/content/about` | — | — | `GET /api/content/about` | VERIFIED |
| Settings Update | `PUT /api/admin/settings` | — | — | `GET /api/admin/settings` | VERIFIED |
| Orders Retrieval | — | — | — | `GET /api/orders`, `GET /api/admin/orders` | VERIFIED |
| Messages Retrieval | `POST /api/messages` | — | — | `GET /api/messages`, `GET /api/admin/messages` | VERIFIED |
| Consultations | — | `PATCH /api/admin/consultations/:id/status` | `DELETE /api/admin/consultations/:id` | `GET /api/admin/consultations` | VERIFIED |
| Testimonials | `POST /api/admin/testimonials` | `PATCH /api/admin/testimonials/:id` | `DELETE /api/admin/testimonials/:id` | `GET /api/admin/testimonials` | VERIFIED |

---

## PHASE 7 — CONTENT FLOW TEST

All CRUD flows verified:

- Admin Portfolio Upload → Database → Portfolio Page: `POST /api/content/portfolio` → saves URLs to Postgres → `GET /api/content/portfolio` returns record
- Admin Product Upload → Database → Shop Page: `POST /api/products` → saves Cloudinary URLs in JSON → `GET /api/products` returns published items
- Admin Virtual Design Upload → Database → Virtual Designs Page: `POST /api/content/virtual-design` → saves URLs → `GET /api/content/virtual-design`
- Admin Service Upload → Database → Services Section: `POST /api/content/services` → saves URLs → `GET /api/content/services`
- Admin About Update → Database → About Section: `PUT /api/content/about` → saves text + image URL → `GET /api/content/about`
- Admin Hero Upload → Database → Hero Section: `POST /api/content/hero-media` → saves image/cloudinaryId → `GET /api/content/hero-media`
- Delete Operations → Database Delete → Frontend Removed: `DELETE` on any resource removes the DB row

All uploads return Cloudinary `secure_url` which is stored in PostgreSQL as plain text. No binary files are stored in the database.

---
