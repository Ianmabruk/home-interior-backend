-- Add mediaSettings JSON column to content models for the image
-- positioning control system (position / zoom / fit per media asset).
ALTER TABLE "projects" ADD COLUMN "media_settings" JSONB;
ALTER TABLE "portfolios" ADD COLUMN "media_settings" JSONB;
ALTER TABLE "abouts" ADD COLUMN "media_settings" JSONB;
ALTER TABLE "products" ADD COLUMN "media_settings" JSONB;
ALTER TABLE "virtual_designs" ADD COLUMN "media_settings" JSONB;
