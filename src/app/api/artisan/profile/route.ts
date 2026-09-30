import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { profileSchema } from "@/lib/validation/artisan";

export const POST = handle(async (req) => {
  const user = await requireRole("ARTISAN");
  const parsed = profileSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const v = parsed.data;

  const cats = await db.serviceCategory.findMany({ where: { id: { in: v.categoryIds }, isActive: true } });
  if (cats.length !== new Set(v.categoryIds).size) throw new HttpError(422, "One of the selected services isn't available.");

  const data = {
    businessName: v.businessName, bio: v.bio || null, yearsExperience: v.yearsExperience, state: v.state, lga: v.lga,
    serviceRadiusKm: v.serviceRadiusKm, availability: v.availability,
    priceMinKobo: v.priceMinNaira != null ? v.priceMinNaira * 100 : null,
    priceMaxKobo: v.priceMaxNaira != null ? v.priceMaxNaira * 100 : null,
  };
  await db.$transaction(async (tx) => {
    await tx.artisan.upsert({ where: { userId: user.id }, create: { userId: user.id, ...data }, update: data });
    await tx.artisanService.deleteMany({ where: { artisanId: user.id } });
    await tx.artisanService.createMany({ data: cats.map((c) => ({ artisanId: user.id, categoryId: c.id, title: c.name })) });
    if (v.lat != null && v.lng != null)
      await tx.$executeRaw`UPDATE "Artisan" SET geog = ST_SetSRID(ST_MakePoint(${v.lng}, ${v.lat}), 4326)::geography WHERE "userId" = ${user.id}`;
  });
  return NextResponse.json({ ok: true });
});
