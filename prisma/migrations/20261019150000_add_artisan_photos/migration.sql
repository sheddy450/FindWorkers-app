-- Artisan photos (profile + portfolio) with moderation. Additive only.
-- CreateEnum
CREATE TYPE "PhotoCategory" AS ENUM ('PROFILE', 'PORTFOLIO', 'BEFORE', 'AFTER', 'WORKSHOP');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ArtisanPhoto" (
    "id" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "thumbUrl" TEXT NOT NULL,
    "blurDataUrl" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "caption" TEXT NOT NULL,
    "category" "PhotoCategory" NOT NULL DEFAULT 'PORTFOLIO',
    "categoryId" TEXT,
    "pairKey" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtisanPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ArtisanPhoto_artisanId_displayOrder_idx" ON "ArtisanPhoto"("artisanId", "displayOrder");

-- CreateIndex
CREATE INDEX "ArtisanPhoto_moderationStatus_createdAt_idx" ON "ArtisanPhoto"("moderationStatus", "createdAt");

-- CreateIndex
CREATE INDEX "ArtisanPhoto_categoryId_moderationStatus_createdAt_idx" ON "ArtisanPhoto"("categoryId", "moderationStatus", "createdAt");

-- AddForeignKey
ALTER TABLE "ArtisanPhoto" ADD CONSTRAINT "ArtisanPhoto_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtisanPhoto" ADD CONSTRAINT "ArtisanPhoto_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
