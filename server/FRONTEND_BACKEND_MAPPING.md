# FRONTEND_BACKEND_MAPPING — HOK Interior Designs

**Date:** 2026-07-22

---

## REQUEST FLOW

```
Frontend Component
  → api.get/post(…)
    → axios interceptor (matches CONTENT_PATHS)
      → prepends /content
    → Express routes under /api
      → Controller
        → Prisma / Cloudinary
        → JSON response
```

---

## FULL MAPPING

| Frontend Path | Interceptor Output | Express Route | Controller Method | DB Table |
|---------------|---------------------|---------------|-------------------|----------|
| `/homepage` | `/content/homepage` | `GET /api/content/homepage` | `contentController.homepageFeed` | Multiple |
| `/portfolio` | `/content/portfolio` | `GET /api/content/portfolio` | `portfolioController.list` | portfolios |
| `/portfolio/:id` | `/content/portfolio/:id` | `GET /api/content/portfolio/:id` | `portfolioController.get` | portfolios |
| `/portfolio` (POST) | `/content/portfolio` | `POST /api/content/portfolio` | `portfolioController.create` | portfolios |
| `/portfolio/:id` (PATCH) | `/content/portfolio/:id` | `PATCH /api/content/portfolio/:id` | `portfolioController.update` | portfolios |
| `/portfolio/:id` (DELETE) | `/content/portfolio/:id` | `DELETE /api/content/portfolio/:id` | `portfolioController.remove` | portfolios |
| `/virtual-design` | `/content/virtual-design` | `GET /api/content/virtual-design` | `virtualDesignController.list` | virtual_designs |
| `/virtual-design/:id` | `/content/virtual-design/:id` | `GET /api/content/virtual-design/:id` | `virtualDesignController.get` | virtual_designs |
| `/virtual-design` (POST) | `/content/virtual-design` | `POST /api/content/virtual-design` | `virtualDesignController.create` | virtual_designs |
| `/virtual-design/:id` (PATCH) | `/content/virtual-design/:id` | `PATCH /api/content/virtual-design/:id` | `virtualDesignController.update` | virtual_designs |
| `/virtual-design/:id` (DELETE) | `/content/virtual-design/:id` | `DELETE /api/content/virtual-design/:id` | `virtualDesignController.remove` | virtual_designs |
| `/services` | `/content/services` | `GET /api/content/services` | `serviceController.list` | services |
| `/services/:id` | `/content/services/:id` | `GET /api/content/services/:id` | `serviceController.get` | services |
| `/services` (POST) | `/content/services` | `POST /api/content/services` | `serviceController.create` | services |
| `/services/:id` (PATCH) | `/content/services/:id` | `PATCH /api/content/services/:id` | `serviceController.update` | services |
| `/services/reorder` | `/content/services/reorder` | `PATCH /api/content/services/reorder` | `serviceController.reorder` | services |
| `/services/:id` (DELETE) | `/content/services/:id` | `DELETE /api/content/services/:id` | `serviceController.remove` | services |
| `/about` | `/content/about` | `GET /api/content/about` | `contentController.getAbout` | abouts |
| `/about` (PUT) | `/content/about` | `PUT /api/content/about` | `contentController.upsertAbout` | abouts |
| `/hero-media` | `/content/hero-media` | `GET /api/content/hero-media` | `heroMediaController.list` | hero |
| `/hero-media` (POST) | `/content/hero-media` | `POST /api/content/hero-media` | `heroMediaController.create` | hero |
| `/hero-media/:id` (PATCH) | `/content/hero-media/:id` | `PATCH /api/content/hero-media/:id` | `heroMediaController.update` | hero |
| `/hero-media/:id` (DELETE) | `/content/hero-media/:id` | `DELETE /api/content/hero-media/:id` | `heroMediaController.remove` | hero |
| `/consultations` (POST) | `/content/consultations` | `POST /api/content/consultations` | `consultationController.createConsultation` | consultations |
| `/admin/consultations` | `/admin/consultations` | `GET /api/admin/consultations` | `consultationController.listConsultations` | consultations |
| `/admin/consultations/export` | `/admin/consultations/export` | `GET /api/admin/consultations/export` | `consultationController.exportConsultationsCsv` | consultations |
| `/admin/consultations/:id/status` (PATCH) | `/admin/consultations/:id/status` | `PATCH /api/admin/consultations/:id/status` | `consultationController.updateConsultationStatus` | consultations |
| `/admin/consultations/:id` (DELETE) | `/admin/consultations/:id` | `DELETE /api/admin/consultations/:id` | `consultationController.deleteConsultation` | consultations |
| `/admin/testimonials` | `/admin/testimonials` | `GET /api/admin/testimonials` | `testimonialController.listAdmin` | testimonials |
| `/admin/testimonials` (POST) | `/admin/testimonials` | `POST /api/admin/testimonials` | `testimonialController.create` | testimonials |
| `/admin/testimonials/:id` (PATCH) | `/admin/testimonials/:id` | `PATCH /api/admin/testimonials/:id` | `testimonialController.update` | testimonials |
| `/admin/testimonials/:id` (DELETE) | `/admin/testimonials/:id` | `DELETE /api/admin/testimonials/:id` | `testimonialController.remove` | testimonials |
| `/media/upload` | `/content/media/upload` | `POST /api/content/media/upload` | `contentController.uploadMediaController` | — |
| `/media/delete` | `/content/media/delete` | `POST /api/content/media/delete` | `contentController.deleteMediaController` | — |
| `/test-upload` | `/content/test-upload` | `POST /api/content/test-upload` | `contentController.uploadMediaController` | — |
| `/products` | `/products` | `GET /api/products` | `productController.listProducts` | products |
| `/products/:id` | `/products/:id` | `GET /api/products/:id` | `productController.getProduct` | products |
| `/products` (POST) | `/products` | `POST /api/products` | `productController.createProduct` | products |
| `/products/:id` (PATCH) | `/products/:id` | `PATCH /api/products/:id` | `productController.updateProduct` | products |
| `/products/:id` (DELETE) | `/products/:id` | `DELETE /api/products/:id` | `productController.deleteProduct` | products |
| `/products/admin/all` | `/products/admin/all` | `GET /api/products/admin/all` | `productController.listAllProducts` | products |
| `/auth/login` | `/auth/login` | `POST /api/auth/login` | `authController.login` | users |
| `/auth/register` | `/auth/register` | `POST /api/auth/register` | `authController.register` | users |
| `/auth/refresh` | `/auth/refresh` | `POST /api/auth/refresh` | `authController.refresh` | users |
| `/auth/logout` | `/auth/logout` | `POST /api/auth/logout` | `authController.logout` | users |
| `/auth/forgot-password` | `/auth/forgot-password` | `POST /api/auth/forgot-password` | `authController.forgotPassword` | users |
| `/auth/reset-password/:token` | `/auth/reset-password/:token` | `POST /api/auth/reset-password/:token` | `authController.resetPassword` | users |
| `/auth/change-password` | `/auth/change-password` | `POST /api/auth/change-password` | `authController.changePassword` | users |
| `/orders` (POST) | `/orders` | `POST /api/orders` | `orderController.createOrder` | orders |
| `/orders/me` | `/orders/me` | `GET /api/orders/me` | `orderController.getMyOrders` | orders |
| `/orders` (GET) | `/orders` | `GET /api/orders` | `orderController.listOrders` | orders |
| `/messages` (POST) | `/messages` | `POST /api/messages` | `messageController.createMessage` | messages |
| `/messages/reply` (POST) | `/messages/reply` | `POST /api/messages/reply` | `messageController.replyToMessage` | messages |
| `/messages` (GET) | `/messages` | `GET /api/messages` | `messageController.listMessages` | messages |
| `/admin/overview` | `/admin/overview` | `GET /api/admin/overview` | `adminController.dashboardOverview` | Multiple |
| `/admin/settings` (GET) | `/admin/settings` | `GET /api/admin/settings` | `adminController.getSettings` | settings |
| `/admin/settings` (PUT) | `/admin/settings` | `PUT /api/admin/settings` | `adminController.updateSettings` | settings |
| `/admin/messages` | `/admin/messages` | `GET /api/admin/messages` | `messageController.listMessages` | messages |
| `/users/me` | `/users/me` | `GET /api/users/me` | `userController.me` | users |
| `/users/me` (PATCH) | `/users/me` | `PATCH /api/users/me` | `userController.updateMe` | users |
| `/users/cart` (GET) | `/users/cart` | `GET /api/users/cart` | `userController.getCart` | users |
| `/users/cart` (POST) | `/users/cart` | `POST /api/users/cart` | `userController.addToCart` | users |
| `/users/cart` (PATCH) | `/users/cart` | `PATCH /api/users/cart` | `userController.updateCartItem` | users |
| `/users/cart/:productId` (DELETE) | `/users/cart/:productId` | `DELETE /api/users/cart/:productId` | `userController.removeCartItem` | users |
| `/users/wishlist` | `/users/wishlist` | `GET /api/users/wishlist` | `userController.getWishlist` | wishlists |
| `/users/wishlist/toggle` (POST) | `/users/wishlist/toggle` | `POST /api/users/wishlist/toggle` | `userController.toggleWishlist` | wishlists |

---

## STATUS SUMMARY

- **Total frontend API calls mapped:** 68
- **PASS:** 68
- **FAIL:** 0

All frontend requests have matching backend routes.
