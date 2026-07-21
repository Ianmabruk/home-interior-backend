# Database Audit Report

**Generated:** 2026-07-21  
**Auditor:** Kilo  
**Scope:** Prisma schema, migrations, database state

---

## 1. Prisma Schema Overview

**File:** `server/prisma/schema.prisma`  
**Total Lines:** 375  
**Prisma Version:** 6.19.3  
**Database:** PostgreSQL  
**Relation Mode:** `prisma` (no DB-level FK constraints)

### Models (20 total)

| Model | Table | PK Strategy | Key Fields |
|-------|-------|-------------|------------|
| `User` | `users` | UUID (`_id`) | `email` (unique), `role`, `cart` (Json), `addresses` (Json) |
| `Wishlist` | `wishlists` | UUID (`_id`) | `userId` (unique), `products` (Json) |
| `Order` | `orders` | UUID (`_id`) | `userId`, `items` (Json), `status`, `paymentStatus` |
| `Product` | `products` | UUID (`_id`) | `sku` (unique), `category`, `images` (Json), `colorVariants` (Json) |
| `ProductImage` | `product_images` | UUID (`_id`) | Relational child for unlimited images |
| `Project` | `projects` | UUID (`_id`) | `media` (Json), `galleryMedia` (Json), `tags` (String[]) |
| `ProjectV2` | `project_v2` | UUID (`_id`) | `videoUrl`, `videoPublicId`, `thumbnailUrl` |
| `Portfolio` | `portfolios` | UUID (`_id`) | `galleryImages` (String[]), `beforeAfterImages` (Json), `displayOrder` |
| `PortfolioMedia` | `portfolio_media` | UUID (`_id`) | Relational child for unlimited media |
| `About` | `abouts` | UUID (`_id`) | `aboutImageUrl`, `socials` (Json), `contactEmail` |
| `VirtualDesign` | `virtual_designs` | UUID (`_id`) | `mediaType`, `mediaUrl`, `galleryMedia` (Json), `cloudinaryId`, `featured` |
| `VirtualDesignMedia` | `virtual_design_media` | UUID (`_id`) | Relational child for unlimited media |
| `Settings` | `settings` | UUID (`_id`) | `siteName`, `supportEmail`, `maintenanceMode` |
| `NewsletterSubscription` | `newsletter_subscriptions` | UUID (`_id`) | `email` (unique) |
| `Analytics` | `analytics` | UUID (`_id`) | `date` (unique), `visits`, `revenue` |
| `Message` | `messages` | UUID (`_id`) | `senderId`, `isRead` |
| `Service` | `services` | UUID (`_id`) | `icon`, `imageUrl`, `cloudinaryId`, `featured`, `displayOrder`, `isActive` |
| `Testimonial` | `testimonials` | UUID (`_id`) | `clientName`, `photoUrl`, `rating`, `displayOrder`, `isActive` |
| `HomepageContent` | `homepage_content` | UUID (`_id`) | `heroImages` (String[]), `title`, `subtitle` |
| `HomepageSettings` | `homepage_settings` | UUID (`_id`) | `heroImages` (String[]), `heroButtons` (Json), `featuredPortfolioIds` (String[]) |
| `Consultation` | `consultations` | UUID (`_id`) | `status` (default `"new"`) |

---

## 2. Migration History

**Location:** `server/prisma/migrations/`  
**Count:** 19 migration files  
**Timeline:** 2026-07-06 to 2026-07-21

### Migration Inventory
| Migration | Date | Purpose |
|-----------|------|---------|
| `20260706223040_init` | 2026-07-06 | Initial schema |
| `20260710000000_media_positioning` | 2026-07-10 | Adds `media_settings` JSONB |
| `20260711000000_schema_hardening` | 2026-07-11 | Backfills `media_settings`, adds FK constraints |
| `20260712174637_add_portfolio_description_project_tags_services` | 2026-07-12 | Portfolio description, project tags/services |
| `20260712175107_make_project_media_optional` | 2026-07-12 | Makes `projects.media` nullable |
| `20260713140000_add_projects_tags_services` | 2026-07-13 | Adds tags/services JSONB to projects |
| `20260713150000_add_projects_tags` | 2026-07-13 | Duplicate intent |
| `20260713160000_add_testimonials_and_last_login` | 2026-07-13 | Adds testimonials, `last_login_at` |
| `20260713220000_make_project_title_description_nullable` | 2026-07-13 | Makes project title/description nullable |
| `20260714070000_add_project_v2` | 2026-07-14 | Creates `project_v2` table |
| `20260715000000_restrict_product_categories` | 2026-07-15 | Creates `ProductCategory` enum |
| `20260715000001_add_portfolio_gallery` | 2026-07-15 | Adds gallery to portfolios |
| `20260715000002_add_thumbnail_public_id` | 2026-07-15 | Adds thumbnail to `project_v2` |
| `20260715000003_add_consultations` | 2026-07-15 | Creates consultations table |
| `20260720000000_rebuild_media_settings` | 2026-07-20 | Adds relational media tables |
| `20260720000001_product_category_enum` | 2026-07-20 | Idempotent enum creation |
| `20260720000002_schema_reconcile` | 2026-07-20 | Corrective migration |
| `20260720000003_fix_missing_tables` | 2026-07-20 | Re-creates missing tables |
| `20260721000000_fix_virtual_design_gallery_and_category` | 2026-07-21 | Virtual design gallery JSONB + category |

---

## 3. Critical Schema Mismatches

### A. `Product.styleVariants` — CRITICAL
- **Used in:** `productController.js` (15+ locations)
- **Schema:** ❌ Not defined
- **DB:** ❌ Not present
- **Impact:** Data silently dropped by `prismaSafeWrite` on every create/update

### B. `Consultation.preferredDate` / `preferredTime` — CRITICAL
- **Used in:** `consultationController.js`, `contentRoutes.js`, `rebuildRoutes.js`
- **Schema:** ❌ Not defined
- **DB:** ❌ Not present
- **Impact:** Data silently dropped

### C. Orphaned DB Columns (in DB but not in schema)
| Table | Column |
|-------|--------|
| `projects` | `cover_image_url`, `video_url`, `video_public_id`, `category`, `before_after_images` |
| `virtual_designs` | `video_url`, `video_public_id`, `services`, `tags`, `cta_primary`, `cta_secondary`, `before_after_images`, `is_published` |
| `portfolios` | `image_public_id`, `order`, `is_published` |
| `project_v2` | `thumbnail_public_id` |

### D. Unused Schema Models
| Model | Status |
|-------|--------|
| `HomepageSettings` | Defined but never queried |
| `ProjectV2` | Defined but never queried |
| `ProductImage` | Defined but never queried |
| `PortfolioMedia` | Defined but never queried |
| `VirtualDesignMedia` | Only used for `deleteMany` |

---

## 4. JSON Fields vs Relations

| Model | JSON Field | Should Be Relation? |
|-------|------------|---------------------|
| `User` | `cart` | Yes — `CartItem[]` |
| `User` | `addresses` | Yes — `Address[]` |
| `Wishlist` | `products` | Yes — `WishlistItem[]` |
| `Order` | `items` | Yes — `OrderItem[]` |
| `Order` | `shippingAddress` | Yes — `Address` |
| `Product` | `images` | Partial — `ProductImage` exists but not used |
| `Product` | `colorVariants` | Yes — `ProductVariant[]` |
| `Portfolio` | `galleryImages` | Partial — `PortfolioMedia` exists but not used |
| `VirtualDesign` | `galleryMedia` | Partial — `VirtualDesignMedia` exists but not used |

---

## 5. Indexes

### Defined in Schema
- `Product`: `isPublished`, `category`, `isFeatured`, `createdAt`
- `ProductImage`: `productId`, `sortOrder`
- `Portfolio`: `featured`, `published`, `displayOrder`, `createdAt`
- `PortfolioMedia`: `portfolioId`, `sortOrder`
- `Project`: `isPublished`, `order`
- `ProjectV2`: `order`, `isPublished`
- `VirtualDesign`: `featured`, `createdAt`
- `VirtualDesignMedia`: `virtualDesignId`, `sortOrder`
- `Service`: `featured`, `displayOrder`, `isActive`
- `Testimonial`: `displayOrder`, `isActive`

### Missing Indexes
| Table | Column | Impact |
|-------|--------|--------|
| `users` | `role` | Admin queries |
| `users` | `is_active` | User management |
| `orders` | `status` | Order filtering |
| `orders` | `payment_status` | Payment queries |
| `orders` | `created_at` | Recent orders |
| `products` | `vendor` | Vendor filtering |
| `products` | `stock` | Inventory queries |
| `messages` | `sender_id` | Message lookups |
| `messages` | `is_read` | Unread count |
| `consultations` | `status` | Status filtering |
| `consultations` | `created_at` | Recent consultations |

---

## 6. Unique Constraints

| Model | Field | DB Index | Schema |
|-------|-------|----------|--------|
| `User` | `email` | ✅ | `@unique` |
| `Wishlist` | `userId` | ✅ | `@unique` |
| `Product` | `sku` | ✅ | `@unique` |
| `NewsletterSubscription` | `email` | ✅ | `@unique` |
| `Analytics` | `date` | ✅ | `@unique` |

---

## 7. Cascade Delete Configuration

| Relationship | Schema Config | DB Enforced? |
|--------------|---------------|--------------|
| `User → Wishlist` | `onDelete: Cascade` | ❌ No (relationMode = "prisma") |
| `User → Order` | `onDelete: Cascade` | ❌ No |
| `User → Message` | `onDelete: SetNull` | ❌ No |
| `Product → ProductImage` | `onDelete: Cascade` | ❌ No |
| `Portfolio → PortfolioMedia` | `onDelete: Cascade` | ❌ No |
| `VirtualDesign → VirtualDesignMedia` | `onDelete: Cascade` | ❌ No |

**Note:** With `relationMode = "prisma"`, all cascade deletes are application-level only. Raw SQL or other services won't enforce them.

---

## 8. Migration Assessment

### `prisma generate`
- **Expected:** SUCCEED
- Schema is syntactically valid

### `prisma db push`
- **Expected:** SUCCEED WITH WARNINGS
- Will add missing columns
- Will warn about orphaned columns
- Will NOT drop columns by default (data protection)

### Risk
If `--force-reset` or `migrate dev` is used later, orphaned columns will be dropped, causing data loss.

---

## 9. Critical Issues Summary

1. **`Product.styleVariants`** not in schema — data silently lost
2. **`Consultation.preferredDate`/`preferredTime`** not in schema — data silently lost
3. **Orphaned DB columns** in `projects`, `virtual_designs`, `portfolios`, `project_v2`
4. **`relationMode = "prisma"`** — no DB-level FK integrity
5. **Unused models** — `HomepageSettings`, `ProjectV2`, `ProductImage`, `PortfolioMedia`, `VirtualDesignMedia`
6. **Missing indexes** on frequently filtered columns
7. **18+ JSON columns** where normalized relations would be better

---

**End of Database Report**
