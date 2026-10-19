import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { looksSame } from "@/lib/photos/rules";

/**
 * Approve or reject one photo. Guarded so two admins clicking at once can't both decide.
 * The artisan is notified: always for a rejection (they need the reason), and for approvals only if
 * they don't already have an unread "photos are live" notice, so ten approvals don't mean ten alerts.
 */
export async function decidePhoto(adminId: string, photoId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const photo = await db.artisanPhoto.findUnique({ where: { id: photoId }, select: { id: true, artisanId: true, moderationStatus: true } });
  if (!photo) throw new HttpError(404, "Photo not found. The artisan may have deleted it.");
  const why = reason?.trim() ?? "";
  if (decision === "REJECTED" && (why.length < 5 || why.length > 300)) throw new HttpError(422, "Give the artisan a reason they can act on (5–300 characters).");
  const now = new Date();
  return db.$transaction(async (tx) => {
    const res = await tx.artisanPhoto.updateMany({
      where: { id: photoId, moderationStatus: "PENDING" },
      data: { moderationStatus: decision, reviewedBy: adminId, reviewedAt: now, rejectReason: decision === "REJECTED" ? why : null,
        ...(decision === "REJECTED" ? { isCover: false } : {}) },
    });
    if (res.count !== 1) throw new HttpError(409, "This photo was already reviewed.");
    await tx.auditLog.create({ data: { actorId: adminId, action: `photo.${decision.toLowerCase()}`, entity: "ArtisanPhoto", entityId: photoId, meta: { artisanId: photo.artisanId, reason: why || null } } });
    if (decision === "REJECTED") {
      await tx.notification.create({ data: { userId: photo.artisanId, type: "photo.decision", payload: { photoId, decision, reason: why } } });
    } else {
      const unread = await tx.notification.findFirst({ where: { userId: photo.artisanId, type: "photo.decision", readAt: null, payload: { path: ["decision"], equals: "APPROVED" } }, select: { id: true } });
      if (!unread) await tx.notification.create({ data: { userId: photo.artisanId, type: "photo.decision", payload: { photoId, decision } } });
    }
  });
}

export type QueueItem = Awaited<ReturnType<typeof photoQueue>>["items"][number];

/**
 * Photos waiting for review, oldest first, each with any photo from a *different* artisan that looks
 * the same (a strong sign one of them copied it). Pro artisans aren't prioritised here: unlike ID
 * checks, photo review is quick and fairness matters more.
 */
export async function photoQueue(take = 30) {
  const [items, total] = await Promise.all([
    db.artisanPhoto.findMany({
      where: { moderationStatus: "PENDING" }, orderBy: { createdAt: "asc" }, take,
      include: {
        service: { select: { name: true } },
        artisan: { select: { userId: true, businessName: true, state: true, lga: true, user: { select: { name: true } },
          _count: { select: { photos: true } } } },
      },
    }),
    db.artisanPhoto.count({ where: { moderationStatus: "PENDING" } }),
  ]);
  // Compare against recent hashed photos from everyone (approved, pending and rejected). In memory is fine
  // at this scale; move to a database index of hash chunks if the photo count reaches the hundreds of thousands.
  type Hashed = { id: string; artisanId: string; phash: string | null; thumbUrl: string; caption: string;
    moderationStatus: "PENDING" | "APPROVED" | "REJECTED"; createdAt: Date; artisan: { businessName: string } };
  const hashed: Hashed[] = items.some((i) => i.phash)
    ? await db.artisanPhoto.findMany({
        where: { phash: { not: null } }, orderBy: { createdAt: "desc" }, take: 20000,
        select: { id: true, artisanId: true, phash: true, thumbUrl: true, caption: true, moderationStatus: true, createdAt: true,
          artisan: { select: { businessName: true } } },
      })
    : [];
  return {
    total,
    items: items.map((i) => ({
      ...i,
      lookalikes: hashed
        .filter((h) => h.artisanId !== i.artisanId && h.id !== i.id && looksSame(i.phash, h.phash))
        .slice(0, 3)
        .map((h) => ({ id: h.id, artisanId: h.artisanId, businessName: h.artisan.businessName, thumbUrl: h.thumbUrl, caption: h.caption,
          status: h.moderationStatus, earlier: h.createdAt < i.createdAt })),
    })),
  };
}
