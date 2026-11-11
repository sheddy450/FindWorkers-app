-- Pro head start on new jobs: free artisans see a job from this time. NULL = everyone at once.
ALTER TABLE "JobPost" ADD COLUMN "openToAllAt" TIMESTAMP(3);
