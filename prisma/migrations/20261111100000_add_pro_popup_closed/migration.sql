-- Pro ad pop-up on the artisan dashboard: remembered per account, so it holds across devices.
ALTER TABLE "Artisan" ADD COLUMN "proPopupClosedAt" TIMESTAMP(3),
ADD COLUMN "proPopupCampaign" TEXT;
