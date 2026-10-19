import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { isPhotoCategory } from "@/lib/photos/rules";
import { uploadPhoto } from "@/server/services/photos.service";

/** Upload one photo (multipart form). The browser sends an already-compressed image + thumbnail. */
export const POST = handle(async (req) => {
  const user = await requireRole("ARTISAN");
  const form = await req.formData().catch(() => null);
  const image = form?.get("image"), thumb = form?.get("thumb"), category = form?.get("category");
  if (!(image instanceof File) || !(thumb instanceof File)) throw new HttpError(422, "Choose a photo to upload.");
  if (!isPhotoCategory(category)) throw new HttpError(422, "Choose what kind of photo this is.");
  const photo = await uploadPhoto(user.id, {
    image: new Uint8Array(await image.arrayBuffer()), thumb: new Uint8Array(await thumb.arrayBuffer()),
    blurDataUrl: form?.get("blur"), caption: String(form?.get("caption") ?? ""), category,
    categoryId: (form?.get("categoryId") as string) || null, pairWithId: (form?.get("pairWith") as string) || null,
    phash: form?.get("hash"),
  });
  return NextResponse.json(photo, { status: 201 });
});
