import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";

export const POST = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const n = await db.notification.findUnique({ where: { id: params.id }, select: { userId: true } });
  if (!n || n.userId !== user.id) throw new HttpError(404, "Notification not found.");
  await db.notification.update({ where: { id: params.id }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
});
