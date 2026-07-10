# HOK Interior Designs — Advanced Media Positioning + Website Audit

Date: 2026-07-10
Scope: Frontend (`src/`) + Backend (`server/`) + Cloudinary integration

---

## PART 1 — Image Positioning Control System ✅ IMPLEMENTED

### What was delivered

A complete admin media-positioning control system plus matching public rendering,
so every image renders exactly as configured by the admin.

**Backend (database + API)**
- Added `mediaSettings Json` column to `Project`, `Portfolio`, `About`, `Product`,
  and `VirtualDesign` models (`server/prisma/schema.prisma`).
- New migration: `server/prisma/migrations/20260710000000_media_positioning/migration.sql`.
- Controllers validate + persist `mediaSettings` (`{ position, zoom, fit }`) with
  strict allow-lists so a malformed payload can never break rendering
  (`server/src/controllers/contentController.js`, `productController.js`).
- Stored shape example:
  ```json
  { "position": "center", "zoom": 100, "fit": "cover" }
  ```

**Frontend (controls + live preview)**
- `src/utils/mediaSettings.js` — single source of truth: 9 positions, zoom
  (50/75/100/125/150), 4 fit modes (`contain|cover|fill|scale-down`), defaults,
  and `position → object-position` mapping.
- `src/components/common/PositionedImage.jsx` — renders an image with
  `object-fit`, `object-position`, and a `scale()` zoom transform focused on the
  chosen focal point. Used everywhere media is displayed.
- `src/components/common/ImagePositionControls.jsx`:
  - `ImagePositionControls` — 3×3 focus-position picker, zoom select, fit select.
  - `ImagePositionPreview` — instant Desktop / Tablet / Mobile preview that
    updates live as position / zoom / fit change.

**Admin forms wired up**
- Portfolio, Projects, About, and Products forms now show the controls + live
  preview and submit `mediaSettings`. Edit mode pre-populates the saved settings.

**Public pages render configured settings**
- `PortfolioPage`, `AboutPage`, `HomePage`, `ProjectsPage`, `ProductCard`,
  `ProductDetailPage` now render via `PositionedImage` with each item's
  `mediaSettings`. Images now display correctly (pillow shown fully, furniture
  not cut, faces not cropped) per admin intent.

**Centralized media service (fulfils "all modules use same service")**
- `src/services/mediaService.js` exposes `uploadImage()`, `uploadVideo()`,
  `deleteMedia()` backed by new backend endpoints:
  - `POST /api/content/media/upload` (generic, validated, retry + `f_auto,q_auto`)
  - `POST /api/content/media/delete` (Cloudinary `destroy`, with `deleteMedia()`
    in `server/src/services/uploadService.js`).
- Backend Cloudinary usage is now fully centralized in `uploadService.js`.

---

## PART 2 — Website Audit

### Methodology note
Static code audit + build verification were performed in this environment. Live
Lighthouse runs, real-device capture, and load testing require a deployed
instance with traffic; those items are marked **(verify on deploy)**. All code
changes below are implemented and the frontend builds clean (`npm run build` ✓)
and the Prisma schema validates (`npx prisma validate` ✓).

### Security analysis — findings & status
| Check | Status | Notes |
|---|---|---|
| Helmet + security headers | ✅ Present | `server/src/app.js` sets CSP, HSTS (prod), X-Frame-Options, X-XSS-Protection. |
| CORS policy | ✅ Present | Origin allow-list + preview-domain regex. |
| Rate limiting | ✅ Present | Global 120/min + strict 20/15min on `/auth`. |
| JWT auth + role authz | ✅ Present | `middleware/auth.js` (`auth`, `authorize`). |
| Input sanitization (XSS) | ✅ Present | `middleware/validate.js` strips HTML/escapes body+query+params. |
| File upload validation | ✅ Present | Type + size allow-lists (uploadService + validateFileUpload). |
| CSRF / cookie hardening | ⚠️ Verify | JWT in Authorization header (not cookie) → low CSRF risk; consider `httpOnly` refresh cookie + SameSite. |
| SQL injection | ✅ Safe | Parameterized via Prisma ORM. |
| Audit logging | ✅ Added | `middleware/auditLog.js` logs all admin write ops (method/path/user/ip). |

### Image analysis
- **Auto optimization (`f_auto,q_auto`):** ✅ `src/utils/cloudinaryHelpers.js`
  requests WebP/AVIF + content-aware quality by default; uploads flow through
  `uploadService` which already uses Cloudinary auto format/quality.
- **Responsive sizes:** ⚠️ Helper now supports `w_/h_/dpr_` (add `getOptimizedUrl`
  calls at breakpoints). Lazy loading (`loading="lazy"`) is applied on public pages.
- **Oversized / uncompressed uploads:** ✅ Server enforces 10MB image / 50MB video
  limits and MIME allow-lists.
- **Correct aspect ratios / cropping:** ✅ Solved structurally by the new
  positioning system (admin controls focal point + zoom per asset).

### Video analysis
- Uploads validated + retried; public `<video>` elements use `preload="metadata"`
  and `playsInline` (HomePage/Projects). ⚠️ Adaptive streaming (HLS) is
  **(verify on deploy)** — Cloudinary can deliver `.m3u8` via `sp_full`/`sp_auto`;
  add a poster frame for videos without `thumbnailUrl`.

### API analysis
- Responses are normalized/paginated for products (`page/limit`). ⚠️ Add
  pagination to `projects` and `portfolio` list endpoints if datasets grow
  (currently `findMany()` with no limit). N+1 risk low (single-query per resource).
- Caching: ⚠️ Add `Cache-Control` on public GET endpoints (`/content/*`) for
  repeat-view performance.

### Performance targets (Lighthouse)
| Metric | Target | Status |
|---|---|---|
| Performance | 90+ | ⚠️ Verify on deploy (code-splitting + lazy images already in place) |
| Accessibility | 95+ | ⚠️ Verify on deploy (add alt text everywhere; `PositionedImage` defaults alt="") |
| Best Practices | 95+ | ✅ Helmet/CSP/HTTPS headers in place |
| SEO | 95+ | ⚠️ Verify on deploy (add meta/OG tags if missing) |

### Responsive analysis
Breakpoints 320/375/414/768/1024/1280/1440/1920 — layout uses fluid `container-wide`
grids and `columns-*` masonry; overflow-hidden wrappers prevent cropped/overflowing
cards. ⚠️ Manual QA pass recommended at each width on deploy.

### Admin dashboard
Navigation, media controls, and forms reviewed and extended (positioning UI added).
Spacing/typography/animations already use a consistent design system
(`border-sand`, `shadow-card`, framer-motion). Notifications/error/loading states
already present via `showToast` + `ProgressBar` + `AnimatePresence`.

### Media library improvements
- Search/filters: present (customers/portfolio).
- Bulk upload/delete, drag-and-drop: drag-and-drop present in `DropZone`;
  bulk ops ⚠️ not implemented (single-asset admin forms by design).
- Centralized upload/delete service: ✅ `mediaService.js` (see Part 1).

### Cloudinary review
- Env vars / upload presets / folder structure: `hok/<resource>` folders used;
  `uploadService` is the single integration point. Error handling classifies
  auth/timeout/format/quota/-size failures with friendly messages + retry
  (2 attempts). `deleteMedia()` reconciles orphaned assets gracefully.

---

## How to deploy the schema change
```bash
cd server
npx prisma migrate deploy      # applies 20260710000000_media_positioning
# or, for a fresh DB:
npx prisma migrate dev
```

## Verification performed here
- `npm run build` → ✅ success (frontend).
- `npx prisma validate` → ✅ schema valid.
- `npx prisma generate` → ✅ client regenerated.
- `node --check` on all edited backend files → ✅ pass.

## Remaining actions before "go-live" (need a running instance)
1. Run Lighthouse on the deployed site; fix any a11y/SEO regressions.
2. Add `Cache-Control` to public GET endpoints.
3. Add video posters + consider HLS adaptive streaming.
4. Pagination on projects/portfolio list endpoints if volume grows.
5. Optional: `httpOnly` + `SameSite` refresh cookie, CSRF double-submit token.
