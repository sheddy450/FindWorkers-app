import { cache } from "react";
import { db } from "@/lib/db";
import { stockPhotoFor } from "@/lib/photos/stock";
import { toPublic, type PublicPhoto } from "@/lib/photos/display";

/** How many active artisans offer each service (an artisan with two titles in one trade counts once). */
export const serviceCounts = cache(async (): Promise<Map<string, number>> => {
  const rows = await db.$queryRaw<{ categoryId: string; n: number }[]>`
    SELECT s."categoryId", COUNT(DISTINCT s."artisanId")::int AS n
    FROM "ArtisanService" s JOIN "User" u ON u.id = s."artisanId"
    WHERE u.status = 'ACTIVE'
    GROUP BY s."categoryId"`;
  return new Map(rows.map((r) => [r.categoryId, Number(r.n)]));
});

/** Active artisans (with at least one service) per state. */
export const stateCounts = cache(async (): Promise<Map<string, number>> => {
  const rows = await db.$queryRaw<{ state: string; n: number }[]>`
    SELECT a.state, COUNT(*)::int AS n
    FROM "Artisan" a JOIN "User" u ON u.id = a."userId"
    WHERE u.status = 'ACTIVE' AND a.state IS NOT NULL
      AND EXISTS (SELECT 1 FROM "ArtisanService" s WHERE s."artisanId" = a."userId")
    GROUP BY a.state`;
  return new Map(rows.map((r) => [r.state, Number(r.n)]));
});

export type ServiceTile = { id: string; slug: string; name: string; count: number; photo: PublicPhoto; example: boolean };

/**
 * Every active service with its artisan count and a photo: the newest approved work photo in that
 * trade, or the trade's example photo until one exists. Sorted by most artisans, then name.
 */
export const serviceTiles = cache(async (): Promise<ServiceTile[]> => {
  const [categories, counts] = await Promise.all([
    db.serviceCategory.findMany({ where: { isActive: true }, select: { id: true, slug: true, name: true } }),
    serviceCounts(),
  ]);
  const ids = categories.map((c) => c.id);
  // Newest approved work photo per service, one query.
  const latest = ids.length ? await db.$queryRaw<{ categoryId: string; id: string }[]>`
    SELECT DISTINCT ON (p."categoryId") p."categoryId", p.id
    FROM "ArtisanPhoto" p JOIN "User" u ON u.id = p."artisanId"
    WHERE p."moderationStatus" = 'APPROVED' AND p.category <> 'PROFILE' AND u.status = 'ACTIVE'
      AND p."categoryId" = ANY(${ids}::text[])
    ORDER BY p."categoryId", p."createdAt" DESC` : [];
  const photos = latest.length ? await db.artisanPhoto.findMany({ where: { id: { in: latest.map((l) => l.id) } } }) : [];
  const byCat = new Map(photos.map((p) => [p.categoryId, toPublic(p)]));
  return categories
    .map((c) => {
      const real = byCat.get(c.id);
      return { ...c, count: counts.get(c.id) ?? 0, photo: real ?? stockPhotoFor(c.slug), example: !real };
    })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
});
