import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { absoluteUrl, stateSlug } from "@/lib/seo/site";

// Built on request (not at build time), so it always lists current artisans and never needs the
// database during a build.
export const dynamic = "force-dynamic";

/** Every public page worth finding on Google: home, services, service+state pages, artisan profiles. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [categories, artisans, combos] = await Promise.all([
    db.serviceCategory.findMany({ where: { isActive: true }, select: { slug: true } }),
    db.artisan.findMany({
      where: { user: { status: "ACTIVE" }, services: { some: {} } },
      select: { userId: true, updatedAt: true }, orderBy: { updatedAt: "desc" }, take: 45_000,
    }),
    // Only service + state pairs that actually have artisans (empty ones are noindex).
    db.$queryRaw<{ slug: string; state: string }[]>`
      SELECT DISTINCT c.slug, a.state
      FROM "ArtisanService" s
      JOIN "ServiceCategory" c ON c.id = s."categoryId" AND c."isActive" = true
      JOIN "Artisan" a ON a."userId" = s."artisanId" AND a.state IS NOT NULL
      JOIN "User" u ON u.id = a."userId" AND u.status = 'ACTIVE'`,
  ]);

  return [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/categories"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/register"), changeFrequency: "monthly", priority: 0.4 },
    ...categories.map((c) => ({ url: absoluteUrl(`/services/${c.slug}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
    ...combos.map((c) => ({ url: absoluteUrl(`/services/${c.slug}/${stateSlug(c.state)}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
    ...artisans.map((a) => ({ url: absoluteUrl(`/artisan-profile/${a.userId}`), lastModified: a.updatedAt, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
}
