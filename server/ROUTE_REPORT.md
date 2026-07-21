# ROUTE REPORT — HOK Interior Designs Backend

**Date:** 2026-07-22
**Method:** Frontend API interceptor analysis + backend route registration audit

---

## ROUTING ARCHITECTURE

```
client (Vite/Netlify)
  → api interceptor (maps content paths)
    → /api/content/* (contentRoutes.js)
    → /api/* (other routes)
```

### Frontend Content Path Interception

The frontend API service (`src/services/api.js`) intercepts requests and prefixes them with `/content`:

```javascript
const CONTENT_PATHS = [
  '/homepage', '/portfolio', '/virtual-design', '/services',
  '/about', '/hero-media', '/consultations', '/media', '/test-upload', '/analytics'
]

if (CONTENT_PATHS.some(p => url === p || url.startsWith(p + '/'))) {
  config.url = '/content' + url
}
```

All other paths (auth, products, users, admin, messages, orders, analytics) are sent directly under `/api/`.

---

## ROUTE REGISTRATION

### Routes Under `/api/`

| Prefix | Route File | Controller |
|--------|-----------|-----------|
| `/api/auth/*` | `authRoutes.js` | `authController` |
| `/api/products*` | `productRoutes.js` | `productController` |
| `/api/content/*` | `contentRoutes.js` | `contentController`, `heroController`, `portfolioController`, `virtualDesignController`, `serviceController`, `consultationController` |
| `/api/orders/*` | `orderRoutes.js` | `orderController` |
| `/api/users/*` | `userRoutes.js` | `userController` |
| `/api/admin/*` | `adminRoutes.js` | `adminController`, `messageController`, `consultationController`, `testimonialController` |
| `/api/analytics/*` | `analyticsRoutes.js` | `analyticsController` |
| `/api/messages/*` | `messageRoutes.js` | `messageController` |

---

## DUPLICATE / CONFLICTING ROUTES

**None found.** No duplicate route handlers exist.

### Previously Flagged
- `POST /api/content/test-upload` and `POST /api/content/media/upload` both map to the same `uploadMediaController`. This is intentional (convenience aliases), not a conflict.

---

## DEAD CODE / UNUSED MIDDLEWARE

| Item | Status |
|------|--------|
| `auditLog` middleware (`src/middleware/auditLog.js`) | **Not mounted** — defined but not imported in any router |
| `sanitizeInput` | **Used** in all write routes |
| `validateFileUpload` | **Used** in upload routes |
| `authLimiter` | **Used** on `/api/auth` |
| `cachePublic` | **Used** globally |
| `isMaintenanceMode` | **Used** globally |

---

## BROKEN IMPORTS

**None.** All controllers import from `../config/prisma.js`, `../utils/asyncHandler.js`, etc., and all paths resolve.

---

## MISSING ROUTES FIXED

| Was | Now |
|-----|-----|
| `POST /api/content/consultations` — no route | Added to `contentRoutes.js` |
| `GET /api/admin/consultations` — no route | Added to `adminRoutes.js` |
| `GET /api/admin/consultations/export` — no route | Added to `adminRoutes.js` |
| `PATCH /api/admin/consultations/:id/status` — no route | Added to `adminRoutes.js` |
| `DELETE /api/admin/consultations/:id` — no route | Added to `adminRoutes.js` |
| `GET /api/admin/testimonials` — no route | Added to `adminRoutes.js` |
| `POST /api/admin/testimonials` — no route | Added to `adminRoutes.js` |
| `PATCH /api/admin/testimonials/:id` — no route | Added to `adminRoutes.js` |
| `DELETE /api/admin/testimonials/:id` — no route | Added to `adminRoutes.js` |
| `PATCH /api/content/services/reorder` — no route | Added to `contentRoutes.js` |

---

## ROUTE-TEST FIXED

`tests/routeTest.js` used `/virtual-designs` (plural) but the backend route is `/virtual-design` (singular). Fixed to match the actual route.
