import { randomUUID } from "crypto";
import type { PhotoCategory } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { delBlobs, putPublic } from "@/lib/providers/blob";
import { NotConfiguredError } from "@/lib/providers/storage";
import { imageInfo, stripImageMetadata, hasMetadata } from "@/lib/photos/image";
import { MAX_EDGE, MAX_IMAGE_BYTES, MAX_THUMB_BYTES, MAX_WORK_PHOTOS, THUMB_EDGE, blurDataUrlOk, captionError, sameIds, sizeOk } from "@/lib/photos/rules";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "./rate-limit.service";

export type UploadInput = {
  image: Uint8Array; thumb: Uint8Array; blurDataUrl: unknown;
  caption: string; category: PhotoCategory; categoryId?: string | null; pairWithId?: string | null;
};

const CONTENT_TYPE = { webp: "image/webp", jpeg: "image/jpeg" } as const;

/** Checks, cleans (removes location data) and stores one photo. New photos wait for admin approval. */
export async function uploadPhoto(artisanId: string, input: UploadInput) {
  const limited = await hitLimit(LIMITS.photoUploadPerUser, artisanId);
  if (!limited.ok) throw new HttpError(429, `Too many uploads. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.`);

  const capErr = captionError(input.caption);
  if (capErr) throw new HttpError(422, capErr);
  if (!blurDataUrlOk(input.blurDataUrl)) throw new HttpError(422, "The preview image is invalid. Please try again.");
  if (input.image.length === 0 || input.image.length > MAX_IMAGE_BYTES) throw new HttpError(422, "That photo is too large even after compressing. Try another photo.");
  if (input.thumb.length === 0 || input.thumb.length > MAX_THUMB_BYTES) throw new HttpError(422, "The thumbnail is invalid. Please try again.");

  const info = imageInfo(input.image), tinfo = imageInfo(input.thumb);
  if (!info || !tinfo) throw new HttpError(422, "Upload a photo (JPG or WebP). Other file types aren't accepted.");
  if (!sizeOk(info.width, info.height, MAX_EDGE) || !sizeOk(tinfo.width, tinfo.height, THUMB_EDGE)) throw new HttpError(422, "That photo's size isn't supported. Please try again from the app.");

  const artisan = await db.artisan.findUnique({ where: { userId: artisanId }, select: { userId: true } });
  if (!artisan) throw new HttpError(409, "Set up your artisan profile before adding photos.");

  if (input.categoryId) {
    const offered = await db.artisanService.findFirst({ where: { artisanId, categoryId: input.categoryId }, select: { id: true } });
    if (!offered) throw new HttpError(422, "Choose one of the services on your profile.");
  }

  const isProfile = input.category === "PROFILE";
  if (!isProfile) {
    const count = await db.artisanPhoto.count({ where: { artisanId, category: { not: "PROFILE" } } });
    if (count >= MAX_WORK_PHOTOS) throw new HttpError(409, `You can have up to ${MAX_WORK_PHOTOS} work photos. Delete one to add another.`);
  }

  // Before/after: link to an existing photo of the opposite kind.
  let pairKey: string | null = null;
  if (input.pairWithId && (input.category === "BEFORE" || input.category === "AFTER")) {
    const other = await db.artisanPhoto.findFirst({ where: { id: input.pairWithId, artisanId } });
    const wanted = input.category === "BEFORE" ? "AFTER" : "BEFORE";
    if (!other || other.category !== wanted) throw new HttpError(422, `Pair it with one of your "${wanted === "BEFORE" ? "Before" : "After"}" photos.`);
    if (other.pairKey) throw new HttpError(422, "That photo already has a partner. Choose another one.");
    pairKey = randomUUID();
    await db.artisanPhoto.update({ where: { id: other.id }, data: { pairKey } });
  }

  const image = stripImageMetadata(input.image), thumb = stripImageMetadata(input.thumb);
  if (hasMetadata(image) || hasMetadata(thumb)) throw new HttpError(422, "We couldn't clean this photo's metadata. Try another photo.");

  const base = `artisans/${artisanId}/${isProfile ? "profile" : "work"}`;
  let stored: { url: string }[] = [];
  try {
    stored = await Promise.all([
      putPublic(`${base}.${info.type === "webp" ? "webp" : "jpg"}`, image, CONTENT_TYPE[info.type]),
      putPublic(`${base}-thumb.${tinfo.type === "webp" ? "webp" : "jpg"}`, thumb, CONTENT_TYPE[tinfo.type]),
    ]);
  } catch (e) {
    if (e instanceof NotConfiguredError) throw new HttpError(503, "Photo uploads aren't available yet.");
    console.error("[photos] upload failed", e);
    throw new HttpError(502, "We couldn't save your photo. Check your connection and try again.");
  }

  const order = await db.artisanPhoto.aggregate({ where: { artisanId }, _max: { displayOrder: true } });
  const created = await db.$transaction(async (t) => {
    const old = isProfile ? await t.artisanPhoto.findMany({ where: { artisanId, category: "PROFILE" } }) : [];
    if (old.length) await t.artisanPhoto.deleteMany({ where: { id: { in: old.map((o) => o.id) } } });
    const photo = await t.artisanPhoto.create({ data: {
      artisanId, url: stored[0].url, thumbUrl: stored[1].url, blurDataUrl: input.blurDataUrl as string,
      width: info.width, height: info.height, caption: input.caption.trim(), category: input.category,
      categoryId: input.categoryId || null, pairKey, displayOrder: (order._max.displayOrder ?? 0) + 1,
    } });
    return { photo, oldUrls: old.flatMap((o) => [o.url, o.thumbUrl]) };
  });
  void delBlobs(created.oldUrls);
  return created.photo;
}

/** Edits caption, service tag or cover. Editing a caption sends the photo back for review. */
export async function updatePhoto(artisanId: string, id: string, patch: { caption?: string; categoryId?: string | null; isCover?: boolean }) {
  const photo = await db.artisanPhoto.findFirst({ where: { id, artisanId } });
  if (!photo) throw new HttpError(404, "Photo not found.");
  const data: { caption?: string; categoryId?: string | null; moderationStatus?: "PENDING" } = {};
  if (patch.caption !== undefined) {
    const err = captionError(patch.caption);
    if (err) throw new HttpError(422, err);
    if (patch.caption.trim() !== photo.caption) { data.caption = patch.caption.trim(); data.moderationStatus = "PENDING"; }
  }
  if (patch.categoryId !== undefined) {
    if (patch.categoryId) {
      const offered = await db.artisanService.findFirst({ where: { artisanId, categoryId: patch.categoryId }, select: { id: true } });
      if (!offered) throw new HttpError(422, "Choose one of the services on your profile.");
    }
    data.categoryId = patch.categoryId || null;
  }
  return db.$transaction(async (t) => {
    if (patch.isCover !== undefined) {
      if (patch.isCover && photo.category === "PROFILE") throw new HttpError(422, "Choose a work photo as your cover.");
      if (patch.isCover) await t.artisanPhoto.updateMany({ where: { artisanId, isCover: true }, data: { isCover: false } });
      await t.artisanPhoto.update({ where: { id }, data: { isCover: patch.isCover } });
    }
    return t.artisanPhoto.update({ where: { id }, data });
  });
}

export async function deletePhoto(artisanId: string, id: string) {
  const photo = await db.artisanPhoto.findFirst({ where: { id, artisanId } });
  if (!photo) throw new HttpError(404, "Photo not found.");
  await db.artisanPhoto.delete({ where: { id } });
  if (photo.pairKey) await db.artisanPhoto.updateMany({ where: { artisanId, pairKey: photo.pairKey }, data: { pairKey: null } });
  void delBlobs([photo.url, photo.thumbUrl]);
}

/** Saves a new order for the work photos (ids must be exactly the artisan's work photos). */
export async function reorderPhotos(artisanId: string, ids: string[]) {
  const current = await db.artisanPhoto.findMany({ where: { artisanId, category: { not: "PROFILE" } }, select: { id: true } });
  if (!sameIds(current.map((c) => c.id), ids)) throw new HttpError(422, "Your photos changed. Refresh and try again.");
  await db.$transaction(ids.map((id, i) => db.artisanPhoto.update({ where: { id }, data: { displayOrder: i + 1 } })));
}
