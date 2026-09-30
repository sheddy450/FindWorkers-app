import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { reportSchema } from "@/lib/validation/report";

export const POST = handle(async (req) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to report something.");
  const parsed = reportSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const { targetType, targetId, reason } = parsed.data;

  const exists = targetType === "REVIEW" ? await db.review.findUnique({ where: { id: targetId }, select: { id: true } })
    : await db.user.findUnique({ where: { id: targetId }, select: { id: true } }); // USER and ARTISAN both key off a user id
  if (!exists) throw new HttpError(404, "The thing you're reporting couldn't be found.");
  if (targetType !== "REVIEW" && targetId === user.id) throw new HttpError(400, "You can't report yourself.");

  const report = await db.report.create({ data: { reporterId: user.id, targetType, targetId, reason } });
  return NextResponse.json({ id: report.id }, { status: 201 });
});
