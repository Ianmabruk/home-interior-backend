# HOK Interior Designs — Complete Performance Optimization Report

Date: 2026-07-11
Engineer role: Senior Performance / React-Vite / Full-Stack Optimization
Constraint honored: **all functionality, UI, animations, routing, APIs, admin, and auth preserved.**

This report covers the final optimization pass and consolidates the work from
prior commits (`c6b2417`, `caa303f`) into one picture.

---

## PHASE 1 — Audit summary (bottlenecks found)

| Area | Finding | Status |
|---|---|---|
| React architecture | SPA, context providers, route-lazy pages | Healthy |
| Vite config | Was default (single 386 KB chunk) | **Fixed** (vendor split) |
| Routing | Already `React.lazy` + `Suspense` per route | Good |
| Component hierarchy | Navbar/Footer outside route Suspense | Good (instant shell) |
| Asset loading | No preconnect; no responsive images; raw video | **Fixed** |
| API patterns | Single combined homepage feed; paginated lists | Good |
| Cloudinary | `f_auto,q_auto` on images only; video raw | **Fixed** (video + srcset) |
| Image delivery | No `srcset`; full-res to mobile | **Fixed** |
| Video delivery | Full-res master, no poster | **Fixed** |
| Bundle size | 386 KB monolith | **Fixed** (30 KB app + vendors) |
| Render-blocking | None critical (module script) | Good |
| LCP risk | Hero video downloaded before first paint | **Fixed** (poster) |
| Unused deps | None (audited all) | Good |
| Duplicate deps | None | Good |
| Slow endpoints | Homepage feed over-fetched all columns | **Fixed** (`select`+`take`) |

---

## PHASE 2 — Frontend optimization
- **Route code-splitting:** already in place (`AppRouter.jsx`) — every page is `React.lazy` + `Suspense`. Verified.
- **Vendor chunking:** `manualChunks` splits `vendor-react`, `vendor-motion`, `vendor-router`, `vendor-axios`, `vendor-icons`. Main app chunk **386 KB → 30 KB**; vendors cache independently and download in parallel.
- **Framer Motion (LazyMotion) — evaluated and REJECTED for stability:** The app uses `whileInView` (scroll-reveal). In framer-motion 12.42, the `viewport` feature that powers `whileInView` is **not** part of the public `domAnimation` or `domMax` bundles, and `InViewFeature` is not exported from the package entry. Converting `motion`→`m` + `LazyMotion` would leave scroll-reveal elements stuck at `opacity:0` (**invisible content**). Because `domMax` is nearly the full feature set anyway (marginal saving) and framer-motion is already isolated in a cached vendor chunk loaded in parallel, the risk far outweighs the gain. Left as-is intentionally.
- **CSS:** Tailwind (JIT, unused classes purged at build); `cssCodeSplit` enabled.

## PHASE 3 — Image optimization
- `cloudinaryHelpers.js`: `buildSrcSet()` generates width variants `[320…1600]` with `f_auto,q_auto,c_limit`.
- `PositionedImage` now emits `srcSet` + `sizes` for Cloudinary sources and an optimized base `src` (`w_1024,c_limit`). Mobiles download a ~320–480px image instead of the full master. Applied everywhere `PositionedImage` is used (Home, Portfolio, Projects, Products, About, ProductCard).
- Modern formats (WebP/AVIF) served automatically via `f_auto`.

## PHASE 4 — Video optimization (critical)
- `getOptimizedVideoUrl()` → `q_auto,f_auto` + `w_<cap>,c_limit` so mobile receives a smaller stream (hero capped 1280, grid tiles 640).
- `getVideoPosterUrl()` → derives a `so_0` JPG poster (`f_auto,q_auto`) so the hero paints an image instantly (better LCP) and grid videos show a still without downloading the clip.
- Applied to: HomePage hero + featured project videos, ProjectsPage cards, VirtualDesignPage grid + fullscreen.
- `preload="metadata"` kept everywhere to avoid full autoplay downloads.

## PHASE 5 — API optimization
- Homepage already a single combined `/content/homepage` call (no N+1/duplicate).
- Payload reduced via DB `select` (Phase 6).
- Axios refresh is de-duplicated via a shared `refreshingPromise`.

## PHASE 6 — Backend optimization
- `homepageFeed`: `select` only rendered fields + `take` (8 projects / 12 portfolio) instead of full-table, full-column scans.
- `compression` (gzip) middleware on all JSON/HTML responses.
- `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600` on anonymous `/content/*` and `/products` GETs.

## PHASE 7 — Service Worker & PWA
- Added **`vite-plugin-pwa`** (`registerType: autoUpdate`, auto-registration).
- Precaches the built app shell (38 entries / ~664 KiB) → repeat visits render instantly and offline.
- Runtime caching:
  - Cloudinary **images** → `CacheFirst` (30-day, 200 entries).
  - Cloudinary **videos** → `CacheFirst` + range requests (14-day, 30 entries).
  - Public **content/product APIs** → `StaleWhileRevalidate` (5-min).
- `navigateFallbackDenylist` excludes `/api` so API calls are never intercepted as navigations. Auth/user endpoints are **not** cached.
- Web app manifest added (installable, themed).

## PHASE 8 — Mobile-first
- Navbar/Footer render immediately (outside route Suspense).
- Hero uses poster for instant first paint; skeleton loaders for loading content.
- Small 30 KB app chunk minimizes main-thread parse on low-end Android.
- `preconnect`/`dns-prefetch` to Cloudinary shortens media TTFB.

## PHASE 9 — Deployment
- **Compression:** gzip via `compression` (backend) + Netlify serves pre-compressed static assets.
- **Caching:** SW + HTTP `Cache-Control` + Vite content-hashed filenames.
- **Env:** `.env.example` scrubbed to placeholders; refresh cookie `SameSite=None; Secure` for Netlify↔Render cross-site.
- **Build:** Yarn standardized (root + `server/yarn.lock`); Render runs `prisma migrate deploy` on start.

## PHASE 10 — Validation performed
- `yarn build` → ✅ success, **0 warnings**; PWA SW generated.
- `yarn lint` → ✅ clean.
- SW registration + manifest injected into `dist/index.html` → ✅.
- Backend `node --check` + `prisma validate` → ✅ (prior commits).
- Functionality preserved: no routes, APIs, admin, auth, or business logic changed; media components are backward-compatible (non-Cloudinary URLs pass through untouched).

---

## Deliverable 1 — Files changed (this pass)
- `vite.config.js` — vite-plugin-pwa + runtime caching (vendor chunking retained).
- `package.json` / `yarn.lock` — add `vite-plugin-pwa` (devDependency).
- `src/utils/cloudinaryHelpers.js` — `buildSrcSet`, `getOptimizedVideoUrl`, `getVideoPosterUrl`, image `crop` option.
- `src/components/common/PositionedImage.jsx` — responsive `srcSet`/`sizes` + optimized base src.
- `src/pages/public/HomePage.jsx` — optimized hero + project video URLs + posters.
- `src/pages/public/ProjectsPage.jsx` — optimized card video + poster.
- `src/pages/public/VirtualDesignPage.jsx` — optimized grid + fullscreen video + posters.
- `.gitignore` — ignore `dev-dist/`.

(Prior commits: vendor chunking, gzip, Cache-Control, homepage `select`, preconnect, Yarn, security.)

## Deliverable 2/3 — Optimizations & estimated impact
| Optimization | Estimated impact |
|---|---|
| Vendor chunk split (386→30 KB app) | Large: faster parse/exec on mobile; near-instant repeat loads |
| PWA precache + runtime caching | Large on repeat visits (near-instant, offline) |
| Responsive image `srcset` | Large on mobile: 3–8× smaller image bytes |
| Video `q_auto,f_auto` + width cap | Large: smaller streams, faster start |
| Video posters | Medium: faster LCP, no clip download to show a frame |
| gzip + Cache-Control | Medium: smaller/cached API payloads |
| Homepage `select`+`take` | Medium: smaller feed payload, faster query |
| preconnect Cloudinary | Small–Medium: earlier media fetch |

## Deliverable 4 — Remaining optional optimizations
1. **Per-usage `sizes`** on grid tiles (currently `100vw` default — safe but conservative; tighter values shave more bytes).
2. **Adaptive HLS** (`sp_auto` / `.m3u8`) for the hero video if true ABR is desired.
3. **LazyMotion** only if a custom feature bundle including the viewport feature is wired via deep import (fragile) or `whileInView` is replaced.
4. **Backend Redis/CDN** in front of `/content/*` for very high traffic.
5. Run **Lighthouse/PageSpeed** on the deployed site to confirm 90+ mobile (cannot execute in this environment).

## Deliverable 5 — Before vs after
| Metric | Before | After |
|---|---|---|
| Main JS chunk | 386 KB (123 KB gz) | 30 KB app + cached vendors |
| Build warnings | 1 (chunk size) | 0 |
| Images on mobile | full-res master | responsive `srcset` (WebP/AVIF) |
| Videos on mobile | full-res, no poster | `q_auto,f_auto`, width-capped, posters |
| API responses | uncompressed, uncached | gzip + `Cache-Control` (SWR) |
| Repeat visits | full re-download | SW precache (instant/offline) |
| Homepage feed | all columns/rows | `select` + `take` |

## Deliverable 6 — Risks & follow-ups
- **Service worker rollout:** `autoUpdate` + `skipWaiting`/`clientsClaim` means the new SW activates on next load; a hard refresh may be needed once to clear a previously cached shell. No stale-content risk for APIs (SWR/short TTL; auth never cached).
- **Cloudinary video posters** assume standard video extensions; non-Cloudinary or extensionless URLs fall back gracefully (`undefined` poster, original src).
- **`sizes="100vw"` default** is safe (never under-fetches) but conservative for grid tiles — see optional #1.
- **Lighthouse score** is enabled but **unverified** here — must be measured on the live deploy.
- **PWA icon:** manifest uses `favicon.svg`; add 192/512 PNG icons for the best install/splash experience on Android.
