-- Create order_status_history table for tracking order status changes over time

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "customer_note" TEXT,
    "estimated_delivery" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE INDEX "order_status_history_order_id_created_at_idx" ON "order_status_history"("order_id", "created_at" DESC);

-- Add foreign key constraint
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" 
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") 
    ON DELETE CASCADE 
    ON UPDATE NO ACTION;

-- Backfill existing orders with initial status history entries
-- Prisma generates CUIDs in the application, so we generate them here using a simple approach
INSERT INTO "order_status_history" ("id", "order_id", "status", "customer_note", "estimated_delivery", "created_at")
SELECT 
    'hist_' || o."id",
    o."id",
    o."status",
    o."customer_note",
    o."estimated_delivery",
    o."created_at"
FROM "orders" o
WHERE o."status" IS NOT NULL
ON CONFLICT DO NOTHING;
