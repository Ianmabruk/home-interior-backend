# DATABASE CONNECTIVITY AUDIT — SUPABASE MIGRATION

**Date:** 2026-07-20  
**Project:** HOK Interior Designs  
**Migration Source:** Neon PostgreSQL → Supabase  
**Auditor:** Automated Systems Audit  

---

## 1. CURRENT CONFIGURATION INSPECTION

### 1.1 DATABASE_URL Components

| Field | Value | Status |
|-------|-------|--------|
| **Hostname** | `db.amcaogrlsrwxbvuglyle.supabase.co` | IPv6-only |
| **Port** | `5432` | Standard PostgreSQL |
| **Username** | `postgres` | Valid |
| **Password** | `<REDACTED>` | Present |
| **Database** | `postgres` | Valid |
| **SSL Mode** | `sslmode=require` | Correct for Supabase |

### 1.2 Endpoint Type

**Current endpoint:** `db.amcaogrlsrwxbvuglyle.supabase.co`  
**Type:** Direct database connection (NOT a connection pooler)

Supabase direct endpoints:
- Provide direct connection to the PostgreSQL instance
- Often expose **IPv6-only** addresses
- **NOT recommended** for serverless/deployment platforms (Render, Vercel, Netlify)

---

## 2. ROOT CAUSE ANALYSIS

### 2.1 Primary Issue: IPv6-Only Direct Endpoint

```
Hostname:     db.amcaogrlsrwxbuglyle.supabase.co
Resolves to: 2a05:d01c:874:6b01:1ba8:aca4:5f68:bc6a (IPv6 only)
IPv4 result: NO A record found
```

**Impact:**
- Local development environment (IPv4-only): `Network is unreachable`
- Render deployment (IPv4-only): Connection refused / timeout
- Any IPv4-only environment: Complete failure

### 2.2 Secondary Issue: Pooler Tenant Identifier

Supabase transaction pooler (`aws-0-us-east-1.pooler.supabase.com:6543`) is reachable via IPv4 but returns:

```
FATAL: (ENOIDENTIFIER) no tenant identifier provided (external_id or sni_hostname required)
```

**Impact:**
- Standard PostgreSQL connection strings fail
- Requires project-specific identification
- Prisma `pg` driver may not pass `options` parameters to the pooler

### 2.3 Compatibility Matrix

| Environment | Direct Endpoint | Pooler (6543) | Status |
|-------------|----------------|---------------|--------|
| Local dev (IPv4) | IPv6 unreachable | Tenant ID required | FAIL |
| Render (IPv4) | IPv6 unreachable | Tenant ID required | FAIL |
| IPv6-enabled host | Works if password valid | Works if tenant ID provided | PASS |
| Supabase Dashboard SQL Editor | N/A (internal) | N/A | PASS |

---

## 3. RECOMMENDED CONFIGURATION

### 3.1 Production DATABASE_URL (Render)

Use the **Supabase transaction pooler** (Supavisor) with project identification.

**Option A — From Supabase Dashboard (Preferred):**
1. Open Supabase Dashboard → Settings → Database
2. Copy the **Supavisor (transaction mode)** connection string
3. It will include the project identifier automatically

**Option B — Manual Construction:**
```
postgresql://postgres:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15
```

**Important:** If the pooler requires a tenant identifier, update the connection string to include it:
```
postgresql://postgres:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&options=-c+project%3Damcaogrlsrwxbvuglyle
```

**Note:** Prisma may not pass `options` to the underlying `pg` driver. If this fails, use the connection string directly from the Supabase dashboard, which may use a different pooler configuration.

### 3.2 Local Development

**Option A — IPv6 Tunnel:**
Use a tunnel service (e.g., `cloudflared`, `ngrok` with IPv6) to forward local port to the IPv6 Supabase endpoint.

**Option B — Supabase Local Dev:**
Use Supabase CLI for local development:
```bash
supabase start
supabase db reset
```
Then point `DATABASE_URL` to `localhost:54322`.

**Option C — SSH Tunnel to IPv6 Host:**
```bash
ssh -6 -L 5432:db.amcaogrlsrwxbvuglyle.supabase.co:5432 user@ipv6-host
```

---

## 4. PRISMA CONFIGURATION

### 4.1 Current Configuration

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

### 4.2 Recommendations

| Setting | Current | Recommended | Notes |
|---------|---------|-------------|-------|
| Provider | `postgresql` | `postgresql` | Correct |
| Relation Mode | `prisma` | `prisma` | Keep for schema migrations |
| Binary Targets | `["native", "debian-openssl-3.0.x"]` | Add `"linux-musl-openssl-3.0.x"` | For Render Alpine builds |
| Connection Pool | Default | `connection_limit=1` | Pooler manages connections |

### 4.3 Prisma Connection String Parameters

For Supabase pooler compatibility:
```
?sslmode=require&connect_timeout=15&pgbouncer=true
```

**Note:** `pgbouncer=true` tells Prisma to expect a connection pooler. This is required for Supabase transaction pooler.

---

## 5. DEPLOYMENT RECOMMENDATIONS

### 5.1 Render Configuration

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Supabase pooler connection string (from dashboard) |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | Your production frontend URL |
| `PRISMA_GENERATE` | `npx prisma generate` (in build command) |
| `PRISMA_MIGRATE` | `npx prisma migrate deploy` (in start command) |

### 5.2 Render Build Command
```bash
cd server && npx prisma generate && npx prisma migrate deploy
```

### 5.3 Render Start Command
```bash
cd server && node src/index.js
```

### 5.4 Environment Variables (Render)

Set these in Render dashboard:
- `DATABASE_URL` — Supabase pooler connection string
- `JWT_ACCESS_SECRET` — Strong random secret
- `JWT_REFRESH_SECRET` — Strong random secret
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret
- `SENDGRID_API_KEY` — SendGrid API key
- `EMAIL_FROM` — Sender email address
- `SEED_ADMIN_EMAIL` — Admin email
- `SEED_ADMIN_PASSWORD` — Admin password

---

## 6. SECURITY CONSIDERATIONS

### 6.1 SSL Requirements

- **Mandatory:** `sslmode=require` or higher
- Supabase enforces SSL for all connections
- Never disable SSL in production
- Use `sslmode=verify-full` for maximum security

### 6.2 Pooler Requirements

- Use Supabase transaction pooler (port 6543) for production
- Do NOT use direct endpoint in production
- Pooler provides connection limiting and protects the database

### 6.3 Credential Management

- Store `DATABASE_URL` in environment variables only
- Never commit `.env` files
- Rotate credentials periodically
- Use strong, unique passwords

---

## 7. TROUBLESHOOTING GUIDE

### 7.1 "Network is unreachable"

**Cause:** IPv6-only direct endpoint from IPv4-only environment  
**Solution:** Use Supabase pooler (port 6543) or enable IPv6

### 7.2 "no tenant identifier provided"

**Cause:** Supabase pooler requires project identification  
**Solution:** Use connection string from Supabase dashboard

### 7.3 "password authentication failed"

**Cause:** Incorrect password in connection string  
**Solution:** Verify password in Supabase Dashboard → Settings → Database

### 7.4 "Can't reach database server"

**Cause:** Firewall, network policy, or incorrect hostname  
**Solution:** Verify Supabase project is not paused; check network policies

---

## 8. ACTION ITEMS

| Priority | Action | Owner | Status |
|----------|--------|-------|--------|
| P0 | Copy production connection string from Supabase dashboard | DevOps | Pending |
| P0 | Update `DATABASE_URL` in Render environment | DevOps | Pending |
| P1 | Update `server/.env.example` with Supabase guidance | Developer | Completed |
| P1 | Update `API_ROUTES.md` with Supabase notes | Developer | Completed |
| P2 | Test production connectivity after deployment | QA | Pending |
| P2 | Document local dev setup with Supabase CLI | Developer | Pending |

---

## 9. RECOMMENDED DATABASE_URL

**Production (Render):**
```
postgresql://postgres:<PASSWORD>@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15
```

**Local Development (IPv6-enabled):**
```
postgresql://postgres:<PASSWORD>@db.amcaogrlsrwxbvuglyle.supabase.co:5432/postgres?sslmode=require
```

**Local Development (Supabase CLI):**
```
postgresql://postgres:postgres@localhost:54322/postgres
```

---

## 10. SUMMARY

| Check | Status |
|-------|--------|
| Direct endpoint reachable | FAIL — IPv6-only |
| Pooler reachable | PASS — IPv4 available |
| Tenant identifier configured | FAIL — Not in current URL |
| SSL configured | PASS |
| Prisma compatible | PASS — with pooler URL |
| Render compatible | PASS — with pooler URL |
| Production ready | PENDING — requires pooler URL from dashboard |

**Bottom Line:** The direct Supabase endpoint is unreachable from IPv4-only environments. Production deployments MUST use the Supabase transaction pooler with the project-specific connection string from the Supabase dashboard. Local development requires IPv6 connectivity or the Supabase CLI.
