import type { Prisma, PrismaClient } from "@prisma/client";
type Tx = PrismaClient | Prisma.TransactionClient;

/** Single source of truth for Artisan.avgRating/reviewCount. Called after any create, hide, or unhide,
 *  so a hidden (moderated) review never counts toward the public rating. */
export async function recomputeArtisanRating(tx: Tx, artisanId: string) {
  const agg = await tx.review.aggregate({ where: { artisanId, hidden: false }, _avg: { rating: true }, _count: true });
  await tx.artisan.update({ where: { userId: artisanId }, data: { avgRating: agg._avg.rating ?? 0, reviewCount: agg._count } });
}
