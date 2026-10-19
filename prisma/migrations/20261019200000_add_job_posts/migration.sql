-- Job posts and quotes: customers post a job, artisans in that trade and state quote, the customer hires one.
CREATE TYPE "JobStatus" AS ENUM ('OPEN', 'HIRED', 'CLOSED');
CREATE TYPE "JobTiming" AS ENUM ('ASAP', 'THIS_WEEK', 'FLEXIBLE', 'ON_DATE');
CREATE TYPE "QuoteStatus" AS ENUM ('SENT', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

CREATE TABLE "JobPost" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "lga" TEXT NOT NULL,
    "budgetMinKobo" INTEGER,
    "budgetMaxKobo" INTEGER,
    "timing" "JobTiming" NOT NULL DEFAULT 'FLEXIBLE',
    "preferredDate" TIMESTAMP(3),
    "status" "JobStatus" NOT NULL DEFAULT 'OPEN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "hiredRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "JobQuote" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "artisanId" TEXT NOT NULL,
    "priceKobo" INTEGER NOT NULL,
    "message" TEXT NOT NULL,
    "canStart" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'SENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "JobQuote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "JobPost_hiredRequestId_key" ON "JobPost"("hiredRequestId");
CREATE INDEX "JobPost_status_categoryId_state_createdAt_idx" ON "JobPost"("status", "categoryId", "state", "createdAt");
CREATE INDEX "JobPost_customerId_createdAt_idx" ON "JobPost"("customerId", "createdAt");
CREATE UNIQUE INDEX "JobQuote_jobId_artisanId_key" ON "JobQuote"("jobId", "artisanId");
CREATE INDEX "JobQuote_artisanId_createdAt_idx" ON "JobQuote"("artisanId", "createdAt");

ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ServiceCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "JobPost" ADD CONSTRAINT "JobPost_hiredRequestId_fkey" FOREIGN KEY ("hiredRequestId") REFERENCES "ServiceRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "JobQuote" ADD CONSTRAINT "JobQuote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "JobPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "JobQuote" ADD CONSTRAINT "JobQuote_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES "Artisan"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
