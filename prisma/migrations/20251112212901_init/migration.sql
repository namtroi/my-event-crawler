-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "event_city" VARCHAR(100) NOT NULL,
    "event_title" VARCHAR(255) NOT NULL,
    "event_datetime" TIMESTAMPTZ(6),
    "address" VARCHAR(255),
    "description" TEXT,
    "image" VARCHAR(255),
    "ticket_price" VARCHAR(100),
    "website_url" VARCHAR(255),
    "country" VARCHAR(100),
    "category" VARCHAR(100),

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "country" VARCHAR(100),
    "category" VARCHAR(100),
    "title" VARCHAR(255),
    "text" TEXT,
    "image" VARCHAR(255),
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events_crawler" (
    "id" SERIAL NOT NULL,
    "event_city" VARCHAR(100) NOT NULL,
    "event_title" VARCHAR(255) NOT NULL,
    "event_datetime" TIMESTAMPTZ,
    "address" VARCHAR(255),
    "description" TEXT,
    "image" VARCHAR(255),
    "ticket_price" VARCHAR(100),
    "website_url" VARCHAR(255) NOT NULL,
    "country" VARCHAR(100),
    "category" VARCHAR(100),
    "crawled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_crawler_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_crawler_website_url_key" ON "events_crawler"("website_url");
