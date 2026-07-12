-- AlterTable
ALTER TABLE "abouts" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "portfolios" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "services" JSONB;
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "tags" JSONB;
ALTER TABLE "projects" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "virtual_designs" ALTER COLUMN "media_settings" DROP DEFAULT;
