-- Perceptual hash for spotting copied photos in moderation.
ALTER TABLE "ArtisanPhoto" ADD COLUMN "phash" TEXT;
