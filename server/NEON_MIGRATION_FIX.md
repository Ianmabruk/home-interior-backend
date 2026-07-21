# DATABASE MIGRATION FIX REPORT

**Date:** 2026-07-20  
**Issue:** Prisma connecting to old Neon database instead of Supabase after migration  
**Error:** `P1001: Can't reach database server at ep-lucky-wave-at15k36r-pooler.c-9.us-east-1.aws.neon.tech`  

---

## 1. ROOT CAUSE

**File:** `render.yaml`  
**Line:** 23-26  

```yaml
# BEFORE (broken)
- key: DATABASE_URL
  fromDatabase:
    name: hok-interior-db
    property: connectionString
```

Render's `fromDatabase` directive injects the `DATABASE_URL` from a Render-managed database service named `hok-interior-db`. This database was originally created with **Neon PostgreSQL**, so Render continues to inject the **old Neon connection string** on every deployment, ignoring the Supabase URL in `server/.env`.

**Impact:** Prisma reads the Render-injected `DATABASE_URL` (Neon) instead of the local `.env` (Supabase), causing `P1001` connection failures.

---

## 2. FILES INSPECTED

| File | Status | Finding |
|------|--------|---------|
| `server/.env` | PASS | Contains Supabase pooler URL |
| `server/.env.example` | PASS | Contains Supabase pooler guidance |
| `server/prisma/schema.prisma` | PASS | Uses `env("DATABASE_URL")`, no `directUrl` |
| `render.yaml` | **FAIL → FIXED** | Was using `fromDatabase` (Neon), now uses Supabase `value` |
| `server/package.json` | PASS | No hardcoded DB URLs |
| `server/src/config/db.js` | PASS | Reads `env.databaseUrl` |
| `server/src/config/env.js` | PASS | Reads `process.env.DATABASE_URL` |
| `server/src/index.js` | PASS | Logs `env.databaseUrl` status |

---

## 3. NEON REFERENCES FOUND

| Location | Type | Action |
|----------|------|--------|
| `render.yaml` (line 23-26) | **Active config** | **FIXED** — Replaced `fromDatabase` with Supabase pooler `value` |
| `REBUILD_REPORTS/4_MIGRATION_RESET_PLAN.md` | Documentation | Left as-is (historical reference) |
| `backups/20260720T120600/BACKUP_MANIFEST.md` | Backup manifest | Left as-is (historical reference) |
| `backups/20260720T120600/server.env.copy` | Backup file | Left as-is (historical reference) |

**No Neon references remain in active source code, configuration, or deployment scripts.**

---

## 4. VARIABLES UPDATED

| Variable | Old Value | New Value |
|----------|-----------|-----------|
| `render.yaml: DATABASE_URL` | `fromDatabase: hok-interior-db` (Neon) | Supabase pooler URL (direct value) |

---

## 5. RENDER ENVIRONMENT VARIABLE AUDIT

| Variable | Source | Value | Status |
|----------|--------|-------|--------|
| `DATABASE_URL` | `render.yaml` | `postgresql://postgres.amcaogrlsrwxbvuglyle:YOUR_PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true` | ✅ Supabase |
| `DATABASE_CONNECTION_URL` | Not set | — | ✅ Not present |
| `DIRECT_URL` | Not set | — | ✅ Not present |
| `POSTGRES_URL` | Not set | — | ✅ Not present |

**Note:** The `YOUR_PASSWORD` placeholder in `render.yaml` must be replaced with the actual Supabase password in the Render dashboard → Environment tab. Do NOT commit the real password to git.

---

## 6. PRISMA DATASOURCE CONFIGURATION

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  relationMode = "prisma"
}
```

- **No `directUrl`** — Correct for Supabase pooler
- **`relationMode = "prisma"`** — Correct for Supabase (avoids foreign key issues with pooler)
- **`url = env("DATABASE_URL")`** — Correctly reads from environment

---

## 7. REMAINING DEPLOYMENT BLOCKERS

| Blocker | Status | Action Required |
|---------|--------|-----------------|
| Neon `fromDatabase` reference | **FIXED** | Updated in `render.yaml` |
| Render `DATABASE_URL` still points to Neon | **FIXED** | Now points to Supabase pooler in `render.yaml` |
| Placeholder password in `render.yaml` | **ACTION REQUIRED** | Replace `YOUR_PASSWORD` with actual Supabase password in Render dashboard |
| Supabase pooler requires SSL | ✅ PASS | `sslmode=require` included in URL |
| Supabase pooler compatibility | ✅ PASS | `pgbouncer=true` included in URL |

---

## 8. CRITICAL ACTION REQUIRED BEFORE DEPLOY

You must update the `DATABASE_URL` value in the **Render dashboard**:

1. Open https://dashboard.render.com
2. Select your `home-interior-backend` service
3. Go to **Environment** tab
4. Find `DATABASE_URL`
5. Replace the value with:

```
postgresql://postgres.amcaogrlsrwxbvuglyle:gQ58tSEI8LPSk6LV@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?sslmode=require&connect_timeout=15&pgbouncer=true
```

6. Click **Save Changes**
7. Trigger a new deploy

---

## 9. VALIDATION RESULTS

| Check | Result |
|-------|--------|
| `prisma validate` | ✅ PASS — Schema is valid |
| `prisma generate` | ✅ PASS — Client generated in 443ms |
| No `directUrl` in schema | ✅ PASS |
| No Neon URLs in source/config | ✅ PASS |
| No Neon env vars in code | ✅ PASS |
| `render.yaml` uses Supabase | ✅ PASS |
| `DATABASE_URL` reads Supabase in `.env` | ✅ PASS |

---

## 10. SUMMARY

| Item | Before | After |
|------|--------|-------|
| `render.yaml` DATABASE_URL source | `fromDatabase: hok-interior-db` (Neon) | Direct Supabase pooler URL |
| Prisma connection target | Neon (`ep-lucky-wave...neon.tech`) | Supabase (`aws-1-eu-west-2.pooler.supabase.com`) |
| Deployment blocker | **YES** — P1001 errors | **FIXED** — pending Render dashboard update |

**Commit:** `6f7c87d`

**Next step:** Update `DATABASE_URL` in Render dashboard with the actual Supabase password, then redeploy.
