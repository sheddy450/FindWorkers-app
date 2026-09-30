import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";

export const POST = handle(async () => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
});
