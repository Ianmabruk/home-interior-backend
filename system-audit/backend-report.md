# Backend Audit Report

**Generated:** 2026-07-21  
**Auditor:** Kilo  
**Scope:** Complete backend codebase (`server/src/`)

---

## 1. Route Registration

### Route Files
| File | Mount Prefix | Route Count |
|------|-------------|-------------|
| `authRoutes.js` | `/api/auth` | 6 |
| `productRoutes.js` | `/api/products` | 11 |
| `contentRoutes.js` | `/api/content` | 24 |
| `orderRoutes.js` | `/api/orders` | 3 |
| `userRoutes.js` | `/api/users` | 6 |
| `adminRoutes.js` | `/api/admin` | 14 |
| `messageRoutes.js` | `/api/messages` | 3 |
| `analyticsRoutes.js` | `/api/analytics` | 5 |
| `rebuildRoutes.js` | `/api` (root) | 23 |

### Duplicate Routes (contentRoutes + rebuildRoutes)
| Path | Methods | Status |
|------|---------|--------|
| `/homepage` | GET, PUT, DELETE | ⚠️ Duplicate |
| `/analytics` | GET | ⚠️ Duplicate |
| `/portfolio` | GET, POST, PATCH | ⚠️ Duplicate |
| `/portfolio/:id` | GET, PATCH, DELETE | ⚠️ Duplicate |
| `/portfolio/reorder` | PATCH | ⚠️ Duplicate |
| `/portfolio/:id/gallery` | POST, DELETE | ⚠️ Duplicate |
| `/virtual-design` | GET, POST | ⚠️ Duplicate |
| `/virtual-design/:id` | GET, PATCH, DELETE | ⚠️ Duplicate |
| `/virtual-design/:id/gallery` | POST, DELETE | ⚠️ Duplicate |
| `/services` | GET, POST | ⚠️ Duplicate |
| `/services/:id` | GET, PATCH, DELETE | ⚠️ Duplicate |
| `/services/reorder` | PATCH | ⚠️ Duplicate |
| `/about` | GET, PUT | ⚠️ Duplicate |
| `/testimonials` | GET | ⚠️ Duplicate |
| `/consultations` | POST | ⚠️ Duplicate |

**Note:** Express uses first-match routing. `contentRoutes` is mounted before `rebuildRoutes`, so the legacy `/content/*` paths work, but the canonical `/api` paths in `rebuildRoutes` are redundant.

---

## 2. Controllers

| Controller | File | Methods | Issues |
|------------|------|---------|--------|
| `authController` | `authController.js` | login, register, logout, refresh, forgotPassword, resetPassword, changePassword | None |
| `productController` | `productController.js` | list, listAll, get, create, update, delete, addVariant, removeVariant, setDefaultVariant, addStyleVariant, removeStyleVariant, setDefaultStyleVariant | `styleVariants` not in schema |
| `contentController` | `contentController.js` | homepageFeed, upsertHomepageContent, deleteHeroImagesController, portfolioList, portfolioDetail, portfolioReorder, create, update, remove, addGalleryImages, removeGalleryImages, serviceList, serviceDetail, serviceReorder, createService, updateService, removeService, aboutContent, updateAbout, consultationCreate, testimonialList, testUpload, deleteMediaController | None |
| `portfolioController` | `portfolioController.js` | create, update, reorder, remove, addGalleryImages, removeGalleryImage | None |
| `virtualDesignController` | `virtualDesignController.js` | list, get, create, update, remove, addGalleryMedia, removeGalleryMedia | Cloudinary delete not wrapped in try/catch (fixed in commit 2a6a38c) |
| `serviceController` | `serviceController.js` | list, get, create, update, delete, toggleActive, reorder | None |
| `adminController` | `adminController.js` | dashboardOverview, listUsers, manageUser, listAllOrders, updateOrderStatus, getSettings, updateSettings | overview/settings crash on DB error (fixed in 2a6a38c) |
| `userController` | `userController.js` | me, updateMe, getWishlist, toggleWishlist, getCart, addToCart, updateCart, removeFromCart | None |
| `orderController` | `orderController.js` | create, listMyOrders, listAll, updateStatus | None |
| `messageController` | `messageController.js` | list, create, reply | None |
| `consultationController` | `consultationController.js` | listConsultations, updateConsultationStatus, deleteConsultation, exportConsultationsCsv | `preferredDate`/`preferredTime` not in schema |
| `testimonialController` | `testimonialController.js` | listAdmin, create, update, reorder, remove | None |

---

## 3. Middleware Stack

| Middleware | File | Purpose |
|------------|------|---------|
| `auth` | `middleware/auth.js` | JWT verification, attaches `req.user` |
| `authorize` | `middleware/auth.js` | Role-based access (`admin`, `user`) |
| `asyncHandler` | `utils/asyncHandler.js` | Catches async errors, logs details |
| `errorHandler` | `middleware/errorHandler.js` | Global error formatting |
| `notFoundHandler` | `middleware/errorHandler.js` | 404 for unmatched routes |
| `cors` | `app.js` | CORS with allowed origins |
| `helmet` | `app.js` | Security headers |
| `compression` | `app.js` | Gzip compression |
| `cookieParser` | `app.js` | Cookie parsing |
| `morgan` | `app.js` | HTTP request logging |
| `rateLimiter` | `middleware/rateLimiter.js` | Rate limiting |
| `upload` | Various | Multer memory storage |

---

## 4. Upload System

| Aspect | Status | Details |
|--------|--------|---------|
| Storage | Cloudinary | `cloudinary.v2` SDK |
| Config | ⚠️ | Placeholder values in `render.yaml` |
| Upload service | ✅ | `uploadService.js` with `uploadImage`, `uploadVideo`, `uploadStream` |
| Delete service | ✅ | `deleteMedia` with graceful failure |
| Multer config | ✅ | Memory storage, 10MB limit |
| Field names | ⚠️ Inconsistent | `media`, `gallery`, `heroImages`, `photo`, `aboutImage`, `galleryImage`, `profileImage` |

---

## 5. Authentication Flow

```
Frontend (localStorage token)
    ↓
Axios interceptor (adds Bearer token)
    ↓
auth middleware (verifies JWT, sets req.user)
    ↓
authorize middleware (checks role)
    ↓
Controller
```

| Feature | Status |
|---------|--------|
| Access token | ✅ JWT with configurable TTL |
| Refresh token | ✅ HTTP-only cookie with `withCredentials` |
| Token refresh | ✅ Auto on 401 with deduplication |
| Logout | ✅ Clears cookie and localStorage |
| Password reset | ✅ Token-based |

---

## 6. Error Handling

| Layer | Status | Notes |
|-------|--------|-------|
| `asyncHandler` | ✅ | Logs route, error, stack, Prisma code, body, params, query |
| `errorHandler` | ✅ | Formats ApiError, MulterError, and generic 500s |
| `prismaSafeWrite` | ✅ | Retries on P2023 (JSON conversion) after stripping offending fields |
| `executeWithRetry` | ✅ | Retries on connection errors and prepared statement errors |

---

## 7. Critical Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | `Product.styleVariants` not in Prisma schema | **HIGH** | `productController.js` vs `schema.prisma` |
| 2 | `Consultation.preferredDate`/`preferredTime` not in schema | **HIGH** | `consultationController.js`, `contentRoutes.js`, `rebuildRoutes.js` |
| 3 | Duplicate routes in `contentRoutes.js` and `rebuildRoutes.js` | **MEDIUM** | Both files register identical paths |
| 4 | Cloudinary credentials are placeholders in production | **HIGH** | `render.yaml` |
| 5 | JWT secrets hardcoded in repo | **HIGH** | `render.yaml`, `env.js` fallbacks |
| 6 | `npm run seed` runs on every Render boot | **MEDIUM** | `render.yaml` startCommand |
| 7 | Unused models: `HomepageSettings`, `ProjectV2`, `ProductImage`, `PortfolioMedia`, `VirtualDesignMedia` | **MEDIUM** | `schema.prisma` |
| 8 | `relationMode = "prisma"` — no FK constraints at DB level | **MEDIUM** | `schema.prisma` datasource |
| 9 | Inconsistent upload field names across dashboards | **LOW** | Multiple controllers |
| 10 | `DELETE /orders/:id` missing from `orderRoutes.js` | **MEDIUM** | Admin cannot delete orders |

---

## 8. Missing Routes / Endpoints

| Missing Route | Needed For | Priority |
|---------------|------------|----------|
| `DELETE /orders/:id` | Admin order deletion | Medium |
| `GET /orders/me` | Frontend account page | **HIGH** (currently returns 404) |
| `PUT /admin/profile` | Admin profile update | **HIGH** (currently returns 404) |
| `GET /users/saved` | Account saved items | **HIGH** (currently returns 404) |
| `POST /auth/change-password` | Change password | **HIGH** (wrong prefix) |
| `POST /content/newsletter` | Footer newsletter | Medium |
| `POST /content/about/gallery` | About gallery upload | Medium |
| `DELETE /content/about/gallery` | About gallery delete | Medium |

---

## 9. Server Startup Sequence

1. `server/src/index.js` loads
2. Connects to PostgreSQL via `connectDB()` (5 retries)
3. Verifies Cloudinary credentials (logs warning if missing)
4. Starts Express server on `process.env.PORT || 5000`
5. Mounts middleware: helmet, compression, cookieParser, cors, morgan, express.json, express.urlencoded
6. Mounts routes: `/api/auth`, `/api/products`, `/api/content`, `/api/orders`, `/api/users`, `/api/admin`, `/api/messages`, `/api/analytics`, `/api` (rebuildRoutes)
7. Starts listening

**Potential Issue:** If `npm run seed` runs on every boot (Render), it may fail or duplicate data if the DB is temporarily unavailable.

---

## 10. Database Connection

| Aspect | Status | Details |
|--------|--------|---------|
| Pooler (Render) | ✅ | `aws-1-eu-west-2.pooler.supabase.com:6543` with `pgbouncer=true` |
| Direct (migrations) | ✅ | `db.amcaogrlsrwxbvuglyle.supabase.co:5432` |
| SSL | ✅ | `sslmode=require` |
| Connection retries | ✅ | 5 retries with backoff |
| Query timeouts | ✅ | 15s default |
| `relationMode` | ⚠️ | `"prisma"` — no DB-level FK constraints |

---

**End of Backend Report**
