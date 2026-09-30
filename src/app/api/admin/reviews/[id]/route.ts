import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { recomputeArtisanRating } from "@/lib/reviews/aggregate";

const body = z.object({ hidden: z.boolean() });

/** Hiding a review keeps the record (for the audit trail and to prevent re-submission) but excludes it
 *  from the artisan's public rating and review count immediately. */
export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) throw new HttpError(422, "Invalid request.");
  const review = await db.review.findUnique({ where: { id: params.id } });
  if (!review) throw new HttpError(404, "Review not found.");

  await db.$transaction(async (tx) => {
    await tx.review.update({ where: { id: params.id }, data: { hidden: p.data.hidden } });
    await recomputeArtisanRating(tx, review.artisanId);
    await tx.auditLog.create({ data: { actorId: admin.id, action: p.data.hidden ? "review.hidden" : "review.unhidden", entity: "Review", entityId: review.id } });
  });
  return NextResponse.json({ ok: true });
});
