import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";

/** Toggle: voting again removes the vote. One vote per person per review, enforced by the
 *  ReviewVote unique(reviewId, userId) constraint as the final backstop against double-counting. */
export const POST = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to mark a review as helpful.");
  const review = await db.review.findUnique({ where: { id: params.id }, select: { id: true, customerId: true, hidden: true } });
  if (!review || review.hidden) throw new HttpError(404, "Review not found.");
  if (review.customerId === user.id) throw new HttpError(400, "You can't vote on your own review.");

  const existing = await db.reviewVote.findUnique({ where: { reviewId_userId: { reviewId: params.id, userId: user.id } } });
  const voted = await db.$transaction(async (tx) => {
    if (existing) {
      await tx.reviewVote.delete({ where: { reviewId_userId: { reviewId: params.id, userId: user.id } } });
      await tx.review.update({ where: { id: params.id }, data: { helpfulCount: { decrement: 1 } } });
      return false;
    }
    await tx.reviewVote.create({ data: { reviewId: params.id, userId: user.id } });
    await tx.review.update({ where: { id: params.id }, data: { helpfulCount: { increment: 1 } } });
    return true;
  });
  return NextResponse.json({ voted });
});
