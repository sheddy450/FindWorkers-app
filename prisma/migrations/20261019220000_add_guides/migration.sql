-- Hiring guides and help articles, editable by admins.
CREATE TYPE "GuideStatus" AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE "GuideAudience" AS ENUM ('CUSTOMER', 'ARTISAN');

CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "categoryId" TEXT,
    "audience" "GuideAudience" NOT NULL DEFAULT 'CUSTOMER',
    "body" TEXT NOT NULL,
    "prices" JSONB,
    "pricesNote" TEXT,
    "questions" TEXT[],
    "redFlags" TEXT[],
    "checklist" TEXT[],
    "status" "GuideStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Guide_slug_key" ON "Guide"("slug");
CREATE INDEX "Guide_status_audience_publishedAt_idx" ON "Guide"("status", "audience", "publishedAt");
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
