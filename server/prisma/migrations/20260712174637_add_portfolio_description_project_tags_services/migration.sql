-- AlterTable
ALTER TABLE "abouts" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "portfolios" ADD COLUMN     "description" TEXT,
ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "services" JSONB,
ADD COLUMN     "tags" JSONB,
ALTER COLUMN "media_settings" DROP DEFAULT;

-- AlterTable
ALTER TABLE "virtual_designs" ALTER COLUMN "media_settings" DROP DEFAULT;
