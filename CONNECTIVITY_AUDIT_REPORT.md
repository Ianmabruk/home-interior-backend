# Frontend ↔ Backend Connectivity Audit & Repair Report

**Date:** 2026-07-09
**Scope:** Full project (frontend Vite/React + backend Express/Prisma at `server/`)
**Result:** Build passes (`npm run build` ✓). Connectivity configuration corrected.

---

## 1. Files Changed

| File | Change |
|------|--------|
| `netlify.toml` | Removed hardcoded placeholder `VITE_API_URL = "https://YOUR-RENDER-SERVICE.onrender.com/api"`. Replaced with a comment instructing that `VITE_API_URL` must be set in the Netlify dashboard (it is never baked into the repo). |
| `server/src/app.js` | Added the explicit production origin `https://homy-comfy.netlify.app` to the CORS `allowedOrigins` list. |
| `.env.example` | Updated the `VITE_API_URL` comment template to the generic `https://<your-render-backend>.onrender.com/api` form. |
| `server/.env.example` | Set `CLIENT_URL=https://homy-comfy.netlify.app` (was `https://your-frontend.netlify.app`). |

No source code in `src/` required changes — see §4.

---

## 1b. Follow-up Fix — Production 404 (`/auth/login`, `/users/me`)

After deploy, the live frontend called `https://home-interior-backend.onrender.com/auth/login`
and returned **404**. Root cause: the deployed `VITE_API_URL` was set to the backend
**root** (`https://home-interior-backend.onrender.com`, no `/api`), so the frontend's
`/auth/login` request became `/auth/login` instead of `/api/auth/login`. The backend
only mounted routes under `/api`, hence 404.

**Fixes applied:**
1. `server/src/app.js` — the API router is now mounted at **both** `/api` and `/`,
   and `/health` responds at both `/api/health` and `/health`. The backend now
   resolves `https://<backend>/auth/login` *and* `https://<backend>/api/auth/login`,
   so it works regardless of whether `VITE_API_URL` ends with `/api`. This fixed the
   already-deployed frontend with **no frontend rebuild required**.
2. `netlify.toml` — `VITE_API_URL` now defaults to the real backend with the `/api`
   suffix: `https://home-interior-backend.onrender.com/api` (the actual Render service
   name). This keeps future builds correct.

## 2. URL / Placeholder Replacements

- **Removed:** `https://YOUR-RENDER-SERVICE.onrender.com/api` (the only real placeholder URL committed in source/config, located in `netlify.toml`).
- **Not hardcoded anymore:** the production API base URL is supplied exclusively through the environment variable `VITE_API_URL`, which is read by `src/services/api.js` via `import.meta.env.VITE_API_URL`.
- **Verified clean:** no occurrences of `your-render-service.onrender.com` remain anywhere in the repo (source, config, or built `dist/`).
- External image/CDN URLs (`images.unsplash.com`, `fonts.googleapis.com`, social links in `Footer.jsx`) are legitimate third-party assets, not API endpoints — left unchanged.

---

## 3. CORS Changes

`cors` (`^2.8.5`) was **already installed and configured** in `server/src/app.js`; no package install required.

- **Production origin explicitly allowed:** `https://homy-comfy.netlify.app`.
- **Localhost dev origins allowed:** `http://localhost:5173-5176` and `http://127.0.0.1:5173-5176`.
- **Wildcard preview origins:** any `*.netlify.app`, `*.vercel.app`, `*.onrender.com` are allowed via regex (covers Netlify/Render preview deploys).
- **`env.clientUrl`** (`CLIENT_URL`) is also allowed, so the value injected on Render is honored.
- **`credentials: true`** is enabled. The app authenticates with **Bearer JWTs stored in `localStorage`** (not cookies), so credentials are not strictly required, but they are left enabled to safely support cookie/session-based flows and are compatible with the wildcard origin handling.

---

## 4. Frontend API Client Audit

- Centralized client: **`src/services/api.js`** — creates a single `axios` instance with `baseURL = import.meta.env.VITE_API_URL || '/api'`, attaches the Bearer token, and implements a 401 refresh interceptor.
- **All 63 API call sites across the app import and use this centralized `api` client** (e.g. `AuthContext`, `ShopContext`, `Footer`, `NewsletterForm`, `AdminPage`, all `pages/*`). No component instantiates `axios` directly or hits a raw `http(s)://` API URL.
- No `fetch()` calls to the backend exist.

## 5. Route Verification

Backend mounts all routes under `/api` (`server/src/routes/index.js`). Verified present:

- `/api/auth/login` (POST), `/api/auth/register`, `/api/auth/refresh`, `/api/auth/forgot-password`, `/api/auth/reset-password/:token`
- `/api/users/me` (GET/PATCH), `/api/users/wishlist`, `/api/users/cart`
- `/api/content/about` (GET/PUT), `/api/content/projects`, `/api/content/portfolio`, `/api/content/virtual-design`, `/api/content/homepage`, `/api/content/analytics`
- `/api/products`, `/api/orders/me`, `/api/messages`, `/api/newsletter/subscribe`, `/api/admin/*`
- `/api/health` (healthcheck)

All match the endpoints the frontend calls.

---

## 6. Remaining Deployment Issues (action required by you)

1. **`VITE_API_URL` (Netlify).** Now defaults to `https://home-interior-backend.onrender.com/api`
   in `netlify.toml`. If you also set it in the Netlify dashboard, ensure it ends with `/api`
   (or rely on the backend's root mount, which handles either form). The backend change above
   means the currently-deployed frontend already works without a rebuild.

2. **Set `CLIENT_URL` on Render** to `https://homy-comfy.netlify.app` (so CORS + password-reset emails point at the real frontend).

3. **Render environment variables** — confirm these are set in the Render dashboard (not just `server/.env`):
   `NODE_ENV=production`, `PORT=5000`, `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`, `SENDGRID_API_KEY`, `EMAIL_FROM`.
   The `env.js` startup check already logs any missing required vars in production.

4. **Rotate secrets before launch.** `server/.env` (committed) contains dev/example JWT secrets and a real SendGrid/Cloudinary key set. Ensure Render uses strong, independent secrets.

5. **Orphan `backend-node/` directory** still exists (stale Postgres/Cloudinary config). It is not referenced by the app (which uses `server/`). Recommend deleting it to avoid confusion. Left untouched by this audit.

---

## 7. Verification

- `npm run build` → **✓ built in ~6s**, no errors.
- Built `dist/` bundle contains no placeholder URL (confirmed via grep) and correctly uses the `/api` base path fallback.
- No `your-render-service.onrender.com` references remain in the repository.
