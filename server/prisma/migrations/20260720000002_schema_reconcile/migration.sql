-- Corrective migration: bring the live database in line with schema.prisma.
-- The earlier migrations were recorded as applied but their DDL did not
-- materialize (deploy pipeline had no migration step). These statements are
-- idempotent (IF NOT EXISTS) and safe to re-run.

ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "cloudinary_id" TEXT;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "display_order" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "gallery_images" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "services" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "title" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "image_url" TEXT,
  "cloudinary_id" TEXT,
  "media_settings" JSONB,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "services_pkey" PRIMARY KEY ("_id")
);
CREATE INDEX IF NOT EXISTS "services_display_order_idx" ON "services"("display_order");
CREATE INDEX IF NOT EXISTS "services_is_active_idx" ON "services"("is_active");

ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "mediaType" TEXT;
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "media_url" TEXT;
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "cloudinary_id" TEXT;
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "featured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "virtual_designs" ADD COLUMN IF NOT EXISTS "gallery_media" TEXT[] DEFAULT ARRAY[]::TEXT[];

CREATE TABLE IF NOT EXISTS "homepage_content" (
  "_id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "hero_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "title" TEXT,
  "subtitle" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "homepage_content_pkey" PRIMARY KEY ("_id")
);
