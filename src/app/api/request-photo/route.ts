import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { getStorage } from "@/lib/providers/storage";
import { CONTENT_TYPES } from "@/lib/validation/upload";

/** Serves one request photo. Only the request's own customer or artisan (or an admin) may view it. */
export const GET = handle(async (req) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const key = new URL(req.url).searchParams.get("key");
  if (!key) throw new HttpError(400, "Missing key.");
  const photo = await db.requestPhoto.findFirst({ where: { storageKey: key }, include: { request: { select: { customerId: true, artisanId: true } } } });
  if (!photo) throw new HttpError(404, "Photo not found.");
  const allowed = user.id === photo.request.customerId || user.id === photo.request.artisanId || user.role === "ADMIN";
  if (!allowed) throw new HttpError(403, "You can't view this photo.");
  const data = await getStorage().get(key);
  if (!data) throw new HttpError(404, "Photo not found.");
  const ext = key.split(".").pop() as keyof typeof CONTENT_TYPES;
  return new Response(new Uint8Array(data), { headers: { "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream", "Cache-Control": "private, no-store" } });
});
