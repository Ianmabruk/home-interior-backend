-- Rebuild-aligned schema additions (non-destructive).
-- Adds: Portfolio.published / Portfolio.featured_image, HomepageSettings table,
-- and relational media child tables (portfolio_media, virtual_design_media, product_images).
-- Existing JSON columns (gallery_images, gallery_media, images) are preserved as
-- backwards-compatible fallbacks. relationMode = "prisma" => no FK constraints.

ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "featured_image" TEXT;
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "published" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "portfolios_published_idx" ON "portfolios"("published");

CREATE TABLE IF NOT EXISTS "homepage_settings" (
  "_id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "hero_images" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "hero_title" TEXT,
  "hero_subtitle" TEXT,
  "hero_buttons" JSONB,
  "featured_portfolio_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "portfolio_media" (
  "_id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "portfolio_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "public_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "portfolio_media_portfolio_id_idx" ON "portfolio_media"("portfolio_id");
CREATE INDEX IF NOT EXISTS "portfolio_media_sort_order_idx" ON "portfolio_media"("sort_order");

CREATE TABLE IF NOT EXISTS "virtual_design_media" (
  "_id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "virtual_design_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "public_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "virtual_design_media_virtual_design_id_idx" ON "virtual_design_media"("virtual_design_id");
CREATE INDEX IF NOT EXISTS "virtual_design_media_sort_order_idx" ON "virtual_design_media"("sort_order");

CREATE TABLE IF NOT EXISTS "product_images" (
  "_id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  "product_id" TEXT NOT NULL,
  "image_url" TEXT NOT NULL,
  "public_id" TEXT,
  "sort_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "product_images_product_id_idx" ON "product_images"("product_id");
CREATE INDEX IF NOT EXISTS "product_images_sort_order_idx" ON "product_images"("sort_order");
