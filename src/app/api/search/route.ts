import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle } from "@/lib/http";
import { WEIGHTS, availabilityScore, bayesianRating, verificationScore } from "@/lib/search/rank";
import { isPro, pickRandom } from "@/lib/pro/rules";
import { approxCoord } from "@/lib/geo/approx";

const FEATURED_SLOTS = 2;

const q = z.object({
  category: z.string().optional(), lat: z.coerce.number().min(3.5).max(14.5).optional(),
  lng: z.coerce.number().min(2.5).max(15).optional(), radiusKm: z.coerce.number().min(1).max(100).default(20),
  state: z.string().optional(), lga: z.string().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  // Presence of the param means "on" — avoids z.coerce.boolean() treating the string "false" as true.
  availableNow: z.string().optional(),
  verifiedOnly: z.string().optional(),
});

export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const p = q.safeParse(Object.fromEntries(url.searchParams));
  if (!p.success) return NextResponse.json({ error: "Invalid search parameters." }, { status: 422 });
  const { category, lat, lng, radiusKm, state, lga, minRating, availableNow, verifiedOnly } = p.data;
  const hasGeo = lat != null && lng != null;

  // Geo path uses PostGIS distance; fallback path filters by state/LGA only.
  const rows: any[] = hasGeo
    ? await db.$queryRaw`
        SELECT a."userId", a."businessName", a."photoKey", a."avgRating", a."reviewCount", a."availability",
               a."state", a."lga", a."priceMinKobo", a."priceMaxKobo", a."proUntil",
               ST_Distance(a.geog, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography) / 1000 AS "distanceKm"
        FROM "Artisan" a
        WHERE a.geog IS NOT NULL
          AND ST_DWithin(a.geog, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusKm * 1000})
          ${category ? db.$queryRaw`AND EXISTS (SELECT 1 FROM "ArtisanService" s JOIN "ServiceCategory" c ON c.id = s."categoryId" WHERE s."artisanId" = a."userId" AND c.slug = ${category})` : db.$queryRaw``}
        LIMIT 60`
    : await db.artisan.findMany({
        where: { ...(state ? { state } : {}), ...(lga ? { lga: { contains: lga, mode: "insensitive" } } : {}),
          ...(category ? { services: { some: { category: { slug: category } } } } : {}) },
        select: { userId: true, businessName: true, photoKey: true, avgRating: true, reviewCount: true, availability: true, state: true, lga: true, priceMinKobo: true, priceMaxKobo: true, proUntil: true },
        take: 60,
      }).then((r) => r.map((a) => ({ ...a, distanceKm: null })));

  if (!rows.length) return NextResponse.json({ results: [], featured: [] });
  const ids = rows.map((r) => r.userId);
  const [verRows, svcRows, coordRows] = await Promise.all([
    db.verificationRecord.findMany({ where: { artisanId: { in: ids }, status: "APPROVED" }, select: { artisanId: true, type: true } }),
    db.artisanService.findMany({ where: { artisanId: { in: ids } }, select: { artisanId: true, category: { select: { name: true } } } }),
    // Map positions for the matched artisans (works for both the geo and the state/LGA search).
    db.$queryRaw<{ userId: string; lat: number; lng: number }[]>`
      SELECT "userId", ST_Y(geog::geometry) AS lat, ST_X(geog::geometry) AS lng
      FROM "Artisan" WHERE geog IS NOT NULL AND "userId" = ANY(${ids}::text[])`,
  ]);
  // Rounded to ~1 km before leaving the server: the map shows an artisan's area, never their address.
  const coordsByArtisan = new Map(coordRows.map((c) => [c.userId, { lat: approxCoord(Number(c.lat)), lng: approxCoord(Number(c.lng)) }]));
  const byArtisan = new Map<string, string[]>();
  for (const v of verRows) byArtisan.set(v.artisanId, [...(byArtisan.get(v.artisanId) ?? []), v.type]);
  const professionsByArtisan = new Map<string, string[]>();
  for (const s of svcRows) {
    const existing = professionsByArtisan.get(s.artisanId) ?? [];
    if (!existing.includes(s.category.name)) professionsByArtisan.set(s.artisanId, [...existing, s.category.name]);
  }

  const ranked = rows.map((r) => {
    const rating = Number(r.avgRating), count = r.reviewCount as number;
    const proximity = r.distanceKm != null ? Math.max(0, 1 - r.distanceKm / radiusKm) : 0.5;
    const score = WEIGHTS.proximity * proximity
      + WEIGHTS.rating * (bayesianRating(rating, count) / 5)
      + WEIGHTS.verification * verificationScore(byArtisan.get(r.userId) ?? [])
      + WEIGHTS.reviewVolume * Math.min(1, Math.log(1 + count) / Math.log(51))
      + WEIGHTS.availability * availabilityScore(r.availability)
      + WEIGHTS.relevance * (category ? 1 : 0.5);
    const pos = coordsByArtisan.get(r.userId);
    return { ...r, avgRating: rating, verifiedTypes: byArtisan.get(r.userId) ?? [], categories: professionsByArtisan.get(r.userId) ?? [], score,
      lat: pos?.lat ?? null, lng: pos?.lng ?? null };
  }).sort((a, b) => b.score - a.score);

  // Explicit filters narrow the list; ranking (above) is a separate concern and never hides a result on its own.
  const filtered = ranked
    .filter((r) => (minRating == null || r.avgRating >= minRating))
    .filter((r) => (!availableNow || r.availability === "AVAILABLE_NOW"))
    .filter((r) => (!verifiedOnly || r.verifiedTypes.length > 0));

  // Featured is a separate, labelled slot (see rank.ts): Pro artisans who match the same filters,
  // picked at random so each gets a fair share. The organic results and their order are unchanged.
  const now = new Date();
  const featured = pickRandom(filtered.filter((r) => isPro(r.proUntil ? new Date(r.proUntil) : null, now)), FEATURED_SLOTS);
  const publicFields = ({ proUntil: _proUntil, ...r }: (typeof filtered)[number]) => r;
  return NextResponse.json({ results: filtered.map(publicFields), featured: featured.map(publicFields) });
});
