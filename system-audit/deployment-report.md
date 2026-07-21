# Deployment Audit Report

**Generated:** 2026-07-21  
**Auditor:** Kilo  
**Scope:** Render deployment, environment variables, CI/CD, Docker

---

## 1. Render Configuration

**File:** `render.yaml`

### Service: `home-interior-backend`
| Property | Value |
|----------|-------|
| Type | `web` |
| Runtime | `node` |
| Root Directory | `server` |
| Build Command | `cd server && npm install && npx prisma generate && npx prisma migrate deploy && npm run seed` |
| Start Command | `cd server && npm run seed && npm start` |

### Environment Variables (render.yaml)
| Variable | Value | Status |
|----------|-------|--------|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | Supabase pooler | ✅ |
| `DIRECT_URL` | Supabase direct | ✅ |
| `JWT_ACCESS_SECRET` | Hardcoded | ⚠️ Security risk |
| `JWT_REFRESH_SECRET` | Hardcoded | ⚠️ Security risk |
| `CLIENT_URL` | `https://homy-comfy.netlify.app` | ✅ |
| `SEED_ADMIN_EMAIL` | `admin@hokinterior.com` | ⚠️ Hardcoded |
| `SEED_ADMIN_PASSWORD` | `admin123` | ⚠️ Hardcoded |
| `CLOUDINARY_CLOUD_NAME` | `REPLACE_WITH_YOUR_CLOUDINARY_CLOUD_NAME` | ❌ Placeholder |
| `CLOUDINARY_API_KEY` | `REPLACE_WITH_YOUR_CLOUDINARY_API_KEY` | ❌ Placeholder |
| `CLOUDINARY_API_SECRET` | `REPLACE_WITH_YOUR_CLOUDINARY_API_SECRET` | ❌ Placeholder |
| `SKIP_DB_VERIFY` | `"false"` | ✅ |

---

## 2. Environment Variables

### Required for Production
| Variable | `render.yaml` | `server/.env` | `.env.example` | Status |
|----------|---------------|---------------|----------------|--------|
| `DATABASE_URL` | ✅ | ✅ | ✅ | OK |
| `DIRECT_URL` | ✅ | ✅ | ✅ | OK |
| `JWT_ACCESS_SECRET` | ✅ (hardcoded) | ✅ | ✅ | ⚠️ Hardcoded |
| `JWT_REFRESH_SECRET` | ✅ (hardcoded) | ✅ | ✅ | ⚠️ Hardcoded |
| `CLOUDINARY_CLOUD_NAME` | ❌ Placeholder | ❌ Empty | ✅ | ❌ **MISSING** |
| `CLOUDINARY_API_KEY` | ❌ Placeholder | ❌ Empty | ✅ | ❌ **MISSING** |
| `CLOUDINARY_API_SECRET` | ❌ Placeholder | ❌ Empty | ✅ | ❌ **MISSING** |
| `CLIENT_URL` | ✅ | ✅ | ✅ | OK |
| `EMAIL_FROM` | ❌ Missing | ❌ Missing | ✅ | ❌ **MISSING** |
| `SEED_ADMIN_EMAIL` | ✅ | ✅ | ✅ | OK |
| `SEED_ADMIN_PASSWORD` | ✅ (hardcoded) | ✅ | ✅ | ⚠️ Hardcoded |

### Hardcoded Fallbacks in Code
**File:** `server/src/config/env.js`

```javascript
jwtAccessSecret: process.env.JWT_ACCESS_SECRET || '4549201ef63a5517aa42bf414e7f7d4d',
jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || '7a29ae8f489a3252be841287f383543a',
seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@hokinterior.com',
seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
```

**Risk:** If env vars are unset, server silently uses hardcoded defaults committed to the repo.

---

## 3. Frontend Configuration

### `vite.config.js`
| Aspect | Status | Details |
|--------|--------|---------|
| Dev proxy | ✅ | `/api` → `localhost:5000` |
| PWA | ✅ | vite-plugin-pwa with Workbox |
| Code splitting | ✅ | Manual vendor chunks |
| Build target | ✅ | `es2020` |

### Environment Variables
| Variable | File | Value | Status |
|----------|------|-------|--------|
| `VITE_API_URL` | `.env` | Empty | ⚠️ Works via proxy in dev |

### Netlify Configuration
**File:** `netlify.toml`
| Property | Value |
|----------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment | `VITE_API_URL=https://home-interior-backend.onrender.com/api` |

---

## 4. CI/CD Configuration

**File:** `.github/workflows/ci.yml`

### Jobs
| Job | Trigger | Node | Package Manager |
|-----|---------|------|-----------------|
| `frontend-test` | push/PR to main/develop | 22 | `yarn` |
| `backend-test` | push/PR to main/develop | 22 | `yarn` |
| `lint-and-format` | push/PR to main/develop | 22 | `yarn` |

### Issues
- CI uses `yarn` but **no `yarn.lock` exists** — will fail or fall back to npm
- Backend tests don't run `prisma migrate deploy`
- No validation of required env vars in CI

---

## 5. Docker Configuration

**File:** `Dockerfile`

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY server/package*.json ./
RUN npm install
COPY server/prisma ./prisma
RUN ./node_modules/.bin/prisma generate --schema ./prisma/schema.prisma
RUN ./node_modules/.bin/prisma db push --schema ./prisma/schema.prisma
COPY server/src ./src
EXPOSE 5000
ENV NODE_ENV=production
CMD ["node", "src/index.js"]
```

### Issues
- Single-stage build (no multi-stage optimization)
- Uses `prisma db push` while Render uses `prisma migrate deploy`
- Does NOT build frontend (backend-only container)
- Exposes port 5000 (Render overrides with `PORT` env var)

---

## 6. CORS Configuration

**File:** `server/src/app.js`

### Allowed Origins
1. `env.clientUrl` (dynamic)
2. `https://homy-comfy.netlify.app` (production)
3. `http://localhost:5173` — `5176`
4. `http://127.0.0.1:5173` — `5176`

### Configuration
- `credentials: true` — Required for HTTP-only refresh cookies
- Returns `403 ApiError` for disallowed origins (not generic CORS error)
- No wildcard `*` origin

---

## 7. Security Headers (Helmet)

**File:** `server/src/app.js`

| Header | Value |
|--------|-------|
| `Content-Security-Policy` | Custom with Cloudinary directives |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer` |

### CSP Directives
| Directive | Allowed Sources |
|-----------|----------------|
| `script-src` | `'self'`, `https://res.cloudinary.com`, `https://*.cloudinary.com` |
| `style-src` | Above + `'unsafe-inline'` |
| `img-src` | `'self'`, `data:`, `blob:`, Cloudinary |
| `media-src` | Cloudinary |
| `connect-src` | API + Cloudinary |

---

## 8. Rate Limiting

**File:** `server/src/middleware/rateLimiter.js`

| Route Pattern | Window | Max Requests |
|---------------|--------|--------------|
| `/api/auth/*` | 15 min | 5 |
| `/api/media/*` | 15 min | 20 |
| Default | 15 min | 100 |

---

## 9. Critical Issues Summary

| # | Issue | Severity | Impact |
|---|-------|----------|--------|
| 1 | Cloudinary credentials are placeholders | **HIGH** | All uploads fail in production |
| 2 | JWT secrets hardcoded in repo | **HIGH** | Security vulnerability |
| 3 | Admin password hardcoded in repo | **HIGH** | Security vulnerability |
| 4 | `EMAIL_FROM` missing | **MEDIUM** | Email sending fails |
| 5 | `seed` runs on every boot | **MEDIUM** | Duplicate data risk |
| 6 | CI uses `yarn` without `yarn.lock` | **MEDIUM** | CI failures |
| 7 | Docker uses `db push`, Render uses `migrate deploy` | **LOW** | Inconsistent migration strategy |
| 8 | Root `.env` has empty `VITE_API_URL` | **LOW** | Works via Netlify env |

---

## 10. Deployment Checklist

- [ ] Set real `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` in Render dashboard
- [ ] Set strong random `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set strong `SEED_ADMIN_PASSWORD`
- [ ] Add `EMAIL_FROM` to Render environment
- [ ] Remove `npm run seed` from Render start command (run once manually)
- [ ] Add `yarn.lock` or switch CI to `npm`
- [ ] Consider switching Dockerfile to use `migrate deploy`
- [ ] Verify `CLIENT_URL` matches actual frontend URL

---

**End of Deployment Report**
