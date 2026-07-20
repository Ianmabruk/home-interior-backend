# HOK Interior Designs — API Routes

Base URL: `/api`

The backend exposes **two** parallel route surfaces that resolve to the same
controllers:

- **Canonical (rebuild) routes** — top-level, spec-aligned paths. Preferred.
- **Legacy `/api/content/*` routes** — kept for backwards compatibility.

## Health
- `GET /health`

## Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password/:token`
- `POST /auth/change-password` (auth)

## Homepage (canonical)
- `GET /homepage`
- `PUT /homepage` (admin, multipart `heroImages[]`)
- `DELETE /homepage/hero-images` (admin)

## Portfolio (canonical)
- `GET /portfolio`
- `GET /portfolio/:id`
- `POST /portfolio` (admin, multipart `media`)
- `PATCH /portfolio/:id` (admin)
- `DELETE /portfolio/:id` (admin)
- `PATCH /portfolio/reorder` (admin)
- `POST /portfolio/:id/gallery` (admin, multipart `gallery[]`)
- `DELETE /portfolio/:id/gallery` (admin)

## Virtual Designs (canonical) — formerly "Virtual Interior Designs"
- `GET /virtual-designs`
- `GET /virtual-designs/:id`
- `POST /virtual-designs` (admin, multipart `media`)
- `PATCH /virtual-designs/:id` (admin)
- `DELETE /virtual-designs/:id` (admin)
- `POST /virtual-designs/:id/gallery` (admin, multipart `gallery[]`)
- `DELETE /virtual-designs/:id/gallery` (admin)

## Services (canonical)
- `GET /services`
- `GET /services/:id`
- `POST /services` (admin, multipart `media`)
- `PATCH /services/:id` (admin)
- `DELETE /services/:id` (admin)
- `PATCH /services/reorder` (admin)

## About (canonical)
- `GET /about`
- `PUT /about` (admin, multipart `media` optional)

## Testimonials (canonical)
- `GET /testimonials`

## Consultations (canonical)
- `POST /consultations`
- `GET /admin/consultations` (admin)
- `PATCH /admin/consultations/:id/status` (admin)
- `DELETE /admin/consultations/:id` (admin)
- `GET /admin/consultations/export` (admin, CSV)

## Products
- `GET /products`
- `GET /products/:id`
- `POST /products` (admin, multipart `images[]`)
- `PATCH /products/:id` (admin)
- `DELETE /products/:id` (admin)
- `GET /products/admin/all` (admin)

## Users
- `GET /users/me` (auth)
- `PATCH /users/me` (auth)
- `GET /users/wishlist` (auth)
- `POST /users/wishlist/toggle` (auth)
- `GET /users/cart` (auth)
- `POST /users/cart` (auth)
- `PATCH /users/cart` (auth)
- `DELETE /users/cart/:productId` (auth)

## Admin / Orders / Messages / Analytics
- `GET /admin/overview` (admin)
- `GET /admin/messages` (admin)
- `POST /orders` (auth)
- `GET /orders/me` (auth)
- `GET /orders` (admin)
- `POST /messages`

## Legacy aliases (still supported)
`/api/content/homepage`, `/api/content/portfolio*`, `/api/content/virtual-design*`,
`/api/content/services*`, `/api/content/about`, `/api/content/consultations`,
`/api/content/testimonials` all proxy to the same controllers as the canonical
routes above.
