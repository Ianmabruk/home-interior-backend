-- Create add_on_services table for managing Virtual Designs add-on services
-- Backend is source of truth for add-on pricing and configuration
CREATE TABLE "add_on_services" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "duration_minutes" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "add_on_services_is_active_display_order_idx" ON "add_on_services"("is_active", "display_order" ASC);
CREATE INDEX "add_on_services_is_active_idx" ON "add_on_services"("is_active");
