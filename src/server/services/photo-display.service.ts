import { db } from "@/lib/db";
import { buildGallery, pickCardPhotos, toPublic, type CardPhotos, type PublicPhoto } from "@/lib/photos/display";

/** Only these columns leave the server: no moderation notes, no hashes. */
const PUBLIC_COLS = {
  id: true, artisanId: true, url: true, thumbUrl: true, blurDataUrl: true, caption: true, width: true, height: true,
  category: true, isCover: true, pairKey: true, displayOrder: true,
} as const;

/** Cover + avatar for a list of artisan cards, approved photos only. */
export async function cardPhotosFor(artisanIds: readonly string[]): Promise<Record<string, CardPhotos>> {
  const ids = [...new Set(artisanIds)];
  if (ids.length === 0) return {};
  const rows = await db.artisanPhoto.findMany({
    where: { artisanId: { in: ids }, moderationStatus: "APPROVED" },
    select: PUBLIC_COLS, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  const out: Record<string, CardPhotos> = {};
  for (const id of ids) out[id] = pickCardPhotos(rows.filter((r) => r.artisanId === id));
  return out;
}

/** Everything the public profile shows. */
export async function profilePhotos(artisanId: string) {
  const rows = await db.artisanPhoto.findMany({
    where: { artisanId, moderationStatus: "APPROVED" },
    select: PUBLIC_COLS, orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
  return { ...pickCardPhotos(rows), ...buildGallery(rows) };
}

export type RecentWork = PublicPhoto & { artisanId: string; businessName: string };

/** Latest approved work photos tagged with a service (optionally only artisans in one state). */
export async function recentWork(categoryId: string, state?: string | null, take = 12): Promise<RecentWork[]> {
  const rows = await db.artisanPhoto.findMany({
    where: {
      categoryId, moderationStatus: "APPROVED", category: { not: "PROFILE" },
      artisan: { user: { status: "ACTIVE" }, ...(state ? { state } : {}) },
    },
    select: { ...PUBLIC_COLS, artisan: { select: { businessName: true } } },
    orderBy: { createdAt: "desc" }, take,
  });
  return rows.map((r) => ({ ...toPublic(r), artisanId: r.artisanId, businessName: r.artisan.businessName }));
}
