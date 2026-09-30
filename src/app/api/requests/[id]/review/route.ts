import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { reviewSchema } from "@/lib/validation/review";
import { recomputeArtisanRating } from "@/lib/reviews/aggregate";

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireRole("CUSTOMER");
  const parsed = reviewSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });

  const r = await db.serviceRequest.findUnique({ where: { id: params.id } });
  if (!r) throw new HttpError(404, "Request not found.");
  if (r.customerId !== user.id) throw new HttpError(403, "This isn't your request.");
  if (r.status !== "COMPLETED") throw new HttpError(409, "You can only review a completed job.");
  // The unique constraint on Review.requestId is the final backstop against duplicates.
  const existing = await db.review.findUnique({ where: { requestId: r.id } });
  if (existing) throw new HttpError(409, "You've already reviewed this job.");

  const { rating, body } = parsed.data;
  await db.$transaction(async (tx) => {
    await tx.review.create({ data: { requestId: r.id, customerId: user.id, artisanId: r.artisanId, rating, body: body || null, isVerifiedService: true } });
    await recomputeArtisanRating(tx, r.artisanId);
    const upd = await tx.serviceRequest.updateMany({ where: { id: r.id, status: "COMPLETED" }, data: { status: "REVIEWED" } });
    if (upd.count !== 1) throw new HttpError(409, "This request just changed. Refresh and try again.");
    await tx.requestStatusEvent.create({ data: { requestId: r.id, fromStatus: "COMPLETED", toStatus: "REVIEWED", actorId: user.id } });
  });
  return NextResponse.json({ ok: true }, { status: 201 });
});
