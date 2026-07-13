# HOK Interior Designs — Production Audit Report

Date: 2026-07-10
Scope: Frontend (`src/`) + Backend (`server/`) · Monorepo deployed as Netlify (frontend) + Render (backend)
Commit: `caa303f`

---

## 1. Build warnings & dependency issues — ✅ RESOLVED
- `vite build` runs **warning-free** (previous single-chunk size warning eliminated by vendor splitting; `chunkSizeWarningLimit` set to 700 as a guard).
- No dependency conflicts. Both `yarn.lock` files resolve cleanly.

## 2. Standardize on a single package manager (Yarn) — ✅ DONE
- Added `packageManager: "yarn@1.22.22"` to root `package.json`.
- Generated `yarn.lock` at repo root **and** `server/yarn.lock` (backend is deployed from `server/`).
- Removed both `package-lock.json` files (no longer tracked).
- Updated `DEPLOYMENT.md`: Netlify build → `yarn build`, Render build → `yarn install && npx prisma generate`, and a note forbidding reintroduction of `package-lock.json`.
- Netlify/Render auto-detect Yarn from the committed lockfiles.

## 3. Remove unused dependencies — ✅ NONE FOUND
- Verified every dependency is referenced:
  - Frontend runtime: `axios, framer-motion, lucide-react, react, react-dom, react-icons, react-router-dom` — all imported. (`react-icons` is used by `SocialIcons.jsx` + `Footer.jsx`.)
  - Backend: all referenced. `pg` and `prisma` are Prisma runtime/dev deps (not directly imported) and are required.
- No dependencies were removed because none were unused.

## 4. Optimize React/Vite build output — ✅ DONE
- `vite.config.js`: `target: es2019`, `cssCodeSplit: true`, `reportCompressedSize: false`, `chunkSizeWarningLimit: 700`.
- **`manualChunks`** splits vendors into independently cacheable chunks:
  `vendor-react`, `vendor-motion`, `vendor-router`, `vendor-axios`, `vendor-icons`, `vendor`.

## 5. Reduce JavaScript bundle size — ✅ DONE
Before → After (main app chunk):

| Chunk | Before | After |
|---|---|---|
| App (`index`) | **386 KB** (123 KB gzip) | **30 KB** |
| vendor-react | (in main) | 182 KB (cached) |
| vendor-motion | (in main) | 128 KB (cached) |
| vendor-router | (in main) | 42 KB (cached) |
| vendor-axios | (in main) | 45 KB (cached) |
| vendor-icons | (in main) | 15 KB (cached) |

The total transferred on first visit is comparable, but the **frequently-changing app code is now 30 KB** and **stable vendors are cached across visits** and downloaded in parallel — dramatically cutting repeat-visit load and main-thread parse time.

## 6. Lazy loading (images, videos, routes) — ✅ DONE
- **Routes:** every page is `React.lazy` + `Suspense` (`AppRouter.jsx`); per-page chunks (HomePage 10 KB, AdminPage 62 KB, etc.).
- **Images:** `loading="lazy"` on public images, `decoding="async"` via `PositionedImage`; hero/preview use eager.
- **Videos:** `preload="metadata"`; hero video kept eager (it is the LCP element).
- **Navbar/Footer:** rendered outside the route `Suspense` in `Layout`, so they paint immediately while page content streams in.

## 7. Compress media assets — ✅ DONE
- Cloudinary URLs request `f_auto,q_auto` (auto WebP/AVIF + content-aware quality) via `getOptimizedUrl`.
- `PositionedImage` + admin forms apply `object-fit`/`object-position` so a single optimized asset serves all crops (no duplicate resized uploads).

## 8. Optimize API calls & backend queries — ✅ DONE
- Homepage feed (`/content/homepage`) now uses `select` (only rendered fields) + `take` limits (8 projects / 12 portfolio) instead of full-table scans → smaller payload, faster transfer on mobile.
- The homepage already uses a **single combined feed call** (no N+1 / duplicate requests).
- Product/list endpoints are paginated.

## 9. Add caching — ✅ DONE
- Backend `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` on anonymous `/content/*` and `/products` GETs (scoped so user/admin data is never cached).
- `compression` (gzip) middleware added to the API → smaller JSON over mobile.
- Vendors + static assets cached by the browser/CDN via content hashing (Vite).

## 10. CORS / env / deployment fixes — ✅ DONE (prior + verified)
- CORS tightened to explicit `allowedOrigins` (removed permissive `*.netlify/vercel/onrender` wildcards).
- Refresh token moved to `httpOnly`, `SameSite=None` (cross-site Netlify↔Render), `Secure` in prod.
- Migrations are no longer run automatically at backend start. The startup sequence now connects to the database, verifies tables and required columns, and seeds the admin user. Migrations must be applied manually during planned deploy windows.
- Cloudinary credentials validated at boot (`verifyCloudinaryConfig`) with a clear warning (no secret leaked).
- `.env.example` secrets scrubbed to placeholders.

## 11. Homepage visible < 2s on mobile — ✅ MEASURES APPLIED
Enablers in place:
- Tiny 30 KB app chunk + parallel, cacheable vendor chunks.
- `preconnect` + `dns-prefetch` to `res.cloudinary.com` (hero media starts downloading sooner).
- Navbar/Footer paint immediately; skeleton loaders for content; single combined API call with `Cache-Control` + gzip.
- LCP hero video uses `preload="metadata"`; images lazy + WebP/AVIF.

> **Note:** Lighthouse / PageSpeed Insights cannot be executed in this environment. The above are the concrete, measurable levers; the live score must be confirmed on the deployed site (target 90+ mobile). Re-run after this deploy.

---

## Performance improvements achieved (summary)
- Main JS bundle: **386 KB → 30 KB** app chunk (+ cacheable vendors).
- Build: **0 warnings**; Yarn-only, lockfiles committed.
- API responses: **gzip-compressed** + **edge/browser cached** (SWR).
- Homepage feed payload: **scoped `select` + `take`** (no full-table transfer).
- Media: **auto WebP/AVIF**, single optimized asset per crop.
- Secrets: **no plaintext secrets** in repo; boot-time Cloudinary validation.

## Remaining recommendations (optional, not blocking)
1. **Run Lighthouse** on the deployed site and address any a11y/SEO items it flags.
2. **Service worker** for true offline/runtime asset+API caching (HTTP `Cache-Control` covers repeat visits for now).
3. **Adaptive video** (`sp_auto`/HLS) for per-device bitrate on the hero video.
4. **`framer-motion` → `LazyMotion` + `m`** if further JS reduction is needed (larger refactor; vendors already cache it).
5. Confirm Render's build command picked up Yarn automatically (lockfile present); if not, set it to `yarn install …` in the dashboard.
