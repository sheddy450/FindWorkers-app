-- Pro plan for artisans: paid placement, stats and settings. Additive only: safe to apply
-- before the code that uses it is deployed.

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- AlterTable
ALTER TABLE "Artisan" ADD COLUMN "proUntil" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amountKobo" INTEGER NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtisanDailyStat" (
    "artisanId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "profileViews" INTEGER NOT NULL DEFAULT 0,
    "contactReveals" INTEGER NOT NULL DEFAULT 0,
    "messagesStarted" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ArtisanDailyStat_pkey" PRIMARY KEY ("artisanId","day")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Artisan_proUntil_idx" ON "Artisan"("proUntil");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_reference_key" ON "Payment"("reference");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_paidAt_idx" ON "Payment"("status", "paidAt");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtisanDailyStat" ADD CONSTRAINT "ArtisanDailyStat_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
