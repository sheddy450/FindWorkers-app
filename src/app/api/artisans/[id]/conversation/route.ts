import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { bumpStat } from "@/server/services/pro.service";

/** Gets-or-creates the one conversation between the current customer and this artisan.
 *  Reused on repeat contact (unique per pair) rather than spawning a new thread every click. */
export const POST = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireRole("CUSTOMER");
  if (params.id === user.id) throw new HttpError(400, "You can't message yourself.");
  const artisan = await db.artisan.findUnique({ where: { userId: params.id }, select: { userId: true } });
  if (!artisan) throw new HttpError(404, "Artisan not found.");

  const blocked = await db.block.findFirst({ where: { OR: [
    { blockerId: user.id, blockedId: params.id }, { blockerId: params.id, blockedId: user.id },
  ] } });
  if (blocked) throw new HttpError(403, "You can't message this person.");

  const existing = await db.conversation.findUnique({ where: { customerId_artisanId: { customerId: user.id, artisanId: params.id } }, select: { id: true } });
  if (existing) return NextResponse.json({ id: existing.id });
  const convo = await db.conversation.upsert({
    where: { customerId_artisanId: { customerId: user.id, artisanId: params.id } },
    create: { customerId: user.id, artisanId: params.id },
    update: {},
  });
  await bumpStat(params.id, "messagesStarted"); // only new conversations count, not repeat taps
  return NextResponse.json({ id: convo.id });
});
