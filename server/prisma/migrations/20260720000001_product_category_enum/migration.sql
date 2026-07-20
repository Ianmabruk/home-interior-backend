-- Align Prisma schema with the existing database: the products.category column
-- is a Postgres enum `ProductCategory` (Mirrors, Frames, "Throw Pillows").
-- This migration is idempotent: it only creates the type if it does not exist.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t WHERE t.typname = 'ProductCategory') THEN
    CREATE TYPE "ProductCategory" AS ENUM ('Mirrors', 'Frames', 'Throw Pillows');
  END IF;
END
$$;
