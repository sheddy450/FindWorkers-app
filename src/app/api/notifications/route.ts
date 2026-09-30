import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";

export const GET = handle(async () => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const notifications = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return NextResponse.json({ notifications });
});
