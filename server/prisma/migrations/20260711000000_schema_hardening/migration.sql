-- Schema hardening migration
-- 1. Backfill media_settings JSONB columns with default {} for existing NULL rows
-- 2. Add cascade delete behaviors

UPDATE "projects" SET "media_settings" = '{}' WHERE "media_settings" IS NULL;
UPDATE "portfolios" SET "media_settings" = '{}' WHERE "media_settings" IS NULL;
UPDATE "abouts" SET "media_settings" = '{}' WHERE "media_settings" IS NULL;
UPDATE "products" SET "media_settings" = '{}' WHERE "media_settings" IS NULL;
UPDATE "virtual_designs" SET "media_settings" = '{}' WHERE "media_settings" IS NULL;

-- Add cascade delete for orders when user is deleted
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add cascade delete for wishlist when user is deleted (already exists, verify)
ALTER TABLE "wishlists" DROP CONSTRAINT IF EXISTS "wishlists_user_id_fkey";
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add set null for message sender when user is deleted
ALTER TABLE "messages" DROP CONSTRAINT "messages_sender_id_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Set NOT NULL default for media_settings after backfill
ALTER TABLE "projects" ALTER COLUMN "media_settings" SET DEFAULT '{}';
ALTER TABLE "portfolios" ALTER COLUMN "media_settings" SET DEFAULT '{}';
ALTER TABLE "abouts" ALTER COLUMN "media_settings" SET DEFAULT '{}';
ALTER TABLE "products" ALTER COLUMN "media_settings" SET DEFAULT '{}';
ALTER TABLE "virtual_designs" ALTER COLUMN "media_settings" SET DEFAULT '{}';
