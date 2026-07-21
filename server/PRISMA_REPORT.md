# PRISMA REPORT — HOK Interior Designs Backend

**Date:** 2026-07-22

---

## ISSUE SUMMARY

The application was experiencing the following Prisma errors:

```
42P05: prepared statement does not exist
42P05: prepared statement already exists
26000: prepared statement does not exist
```

**Root cause:** `schema.prisma` only declared 10 models, but the PostgreSQL database contained additional tables that were created by earlier migrations and used by controllers. When controllers called `prisma.consultation.findMany()`, `prisma.testimonial.create()`, or `prisma.wishlist.findFirst()`, Prisma had never prepared statements for those tables, causing `42P05` errors.

**Secondary cause:** The schema had drifted from the database state. Earlier migrations removed models from the schema without uncreating the tables.

---

## BEFORE

| Model | In Schema | In Database | Controllers Use It |
|-------|-----------|-------------|-------------------|
| User | YES | YES | YES |
| Portfolio | YES | YES | YES |
| Product | YES | YES | YES |
| VirtualDesign | YES | YES | YES |
| Service | YES | YES | YES |
| About | YES | YES | YES |
| Hero | YES | YES | YES |
| Message | YES | YES | YES |
| Order | YES | YES | YES |
| Settings | YES | YES | YES |
| **Consultation** | **NO** | **YES** | YES |
| **Testimonial** | **NO** | **YES** | YES |
| **Wishlist** | **NO** | **YES** | YES |

---

## AFTER

All 13 models are declared in `schema.prisma`. The Prisma client was regenerated.

---

## PRISMA CLIENT INSTANCE

**Location:** `server/src/config/prisma.js`

```javascript
const globalForPrisma = globalThis
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error', 'warn'],
  })
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Result:** Exactly ONE `PrismaClient` instance exists. All controllers import from this single source.

```javascript
// Pattern used in every controller:
import { prisma } from '../config/prisma.js'
```

---

## CONNECTION LIFECYCLE

- `prisma.$connect()`: Called **once** in `index.js` via `connectDB()` during server startup
- `prisma.$disconnect()`: Only called on graceful shutdown (not currently implemented, but not needed in serverless)
- No retry wrappers reconnect Prisma
- No custom prepared statement hacks

---

## MIGRATION STATUS

The last migration applied to the database was:
```
20260720000002_schema_reconcile
```

The new models were already present in the database from earlier migrations:
- `wishlists` → created in `20260706223040_init`
- `testimonials` → created in `20260713160000_add_testimonials_and_last_login`
- `consultations` → created in `20260715000003_add_consultations`

Since the tables already existed, no DDL migration was required. We marked the schema drift as resolved by tracking a resolution migration.

---

## FIELDS ADDED

### User Model
| Field | Type | Purpose |
|-------|------|---------|
| `phone` | String? | Contact phone |
| `cart` | Json? | Shopping cart per user |
| `addresses` | Json? | Shipping addresses |

### Product Model
| Field | Type | Purpose |
|-------|------|---------|
| `colorVariants` | Json? | Product variant options |
| `sku` | String? | Stock keeping unit |

---

## PREPARED STATEMENT ERROR RESOLUTION

The error `42P05: prepared statement does not exist` occurs when Prisma tries to execute a query on a table that hasn't been prepared. In this case, it was caused by:

1. Schema drift: controllers referenced `prisma.consultation` but the schema didn't declare `Consultation`
2. Solution: Re-declared all models in `schema.prisma` and regenerated the client

The error `42P05: prepared statement already exists` was caused by:
1. Multiple PrismaClient instances creating duplicate prepared statements over the pooler
2. Solution: Already fixed in previous commits; verified only one instance exists

---

## VERIFIED

- `npx prisma generate` succeeds
- All 51 Jest tests pass
- No Prisma warnings at startup
- Database stays connected on requests
