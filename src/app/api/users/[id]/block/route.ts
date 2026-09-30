import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";

/** Blocking is one-directional and does not require the other side's consent. It's enforced in
 *  the messaging API (either direction) so a blocked pair can't reach each other about any job. */
export const POST = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  if (params.id === user.id) throw new HttpError(400, "You can't block yourself.");
  const target = await db.user.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!target) throw new HttpError(404, "User not found.");
  await db.block.upsert({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: params.id } }, create: { blockerId: user.id, blockedId: params.id }, update: {} });
  return NextResponse.json({ ok: true });
});

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  await db.block.deleteMany({ where: { blockerId: user.id, blockedId: params.id } });
  return NextResponse.json({ ok: true });
});
