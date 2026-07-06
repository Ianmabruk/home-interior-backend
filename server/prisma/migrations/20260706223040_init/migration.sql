-- CreateTable
CREATE TABLE "users" (
    "_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "avatar_url" TEXT,
    "phone" TEXT,
    "refresh_token" TEXT,
    "password_reset_token" TEXT,
    "password_reset_expires" TIMESTAMP(3),
    "is_active" BOOLEAN DEFAULT true,
    "cart" JSONB,
    "addresses" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "products" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "orders" (
    "_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "items" JSONB NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "shipping_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "shipping_address" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "products" (
    "_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "discount_price" DOUBLE PRECISION,
    "images" JSONB NOT NULL,
    "color_variants" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "vendor" TEXT DEFAULT '',
    "stock" INTEGER NOT NULL,
    "sku" TEXT NOT NULL,
    "tags" JSONB NOT NULL,
    "is_featured" BOOLEAN DEFAULT false,
    "is_published" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "projects" (
    "_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "media" JSONB NOT NULL,
    "before_after_images" JSONB,
    "video_url" TEXT,
    "video_public_id" TEXT,
    "cover_image_url" TEXT,
    "order" INTEGER DEFAULT 0,
    "is_published" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "portfolios" (
    "_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "image_url" TEXT,
    "image_public_id" TEXT,
    "order" INTEGER DEFAULT 0,
    "is_published" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "portfolios_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "abouts" (
    "_id" TEXT NOT NULL,
    "about_image_url" TEXT,
    "about_image_public_id" TEXT,
    "story" TEXT NOT NULL,
    "company_description" TEXT NOT NULL,
    "mission" TEXT NOT NULL,
    "vision" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "contact_email" TEXT NOT NULL,
    "socials" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "abouts_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "virtual_designs" (
    "_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "video_url" TEXT,
    "video_public_id" TEXT,
    "thumbnail_url" TEXT,
    "services" JSONB NOT NULL,
    "before_after_images" JSONB,
    "category" TEXT,
    "tags" JSONB NOT NULL,
    "cta_primary" TEXT DEFAULT 'Start Your Project',
    "cta_secondary" TEXT DEFAULT 'Learn More',
    "is_published" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "virtual_designs_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "_id" TEXT NOT NULL,
    "site_name" TEXT DEFAULT 'HOK Interior Designs',
    "support_email" TEXT DEFAULT 'info@hokinterior.com',
    "maintenance_mode" BOOLEAN DEFAULT false,
    "currency" TEXT DEFAULT 'USD',
    "shipping_policy" TEXT DEFAULT '',
    "return_policy" TEXT DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "newsletter_subscriptions" (
    "_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "source" TEXT DEFAULT 'website',
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "newsletter_subscriptions_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "analytics" (
    "_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "visits" INTEGER DEFAULT 0,
    "revenue" INTEGER DEFAULT 0,
    "orders" INTEGER DEFAULT 0,
    "new_users" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "_id" TEXT NOT NULL,
    "sender_id" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_read" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_user_id_key" ON "wishlists"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscriptions_email_key" ON "newsletter_subscriptions"("email");

-- CreateIndex
CREATE UNIQUE INDEX "analytics_date_key" ON "analytics"("date");

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("_id") ON DELETE SET NULL ON UPDATE CASCADE;
