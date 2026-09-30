import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { messageSchema } from "@/lib/validation/message";

async function sideOf(requestId: string, userId: string) {
  const r = await db.serviceRequest.findUnique({ where: { id: requestId }, select: { customerId: true, artisanId: true } });
  if (!r) throw new HttpError(404, "Request not found.");
  if (userId !== r.customerId && userId !== r.artisanId) throw new HttpError(403, "This isn't your conversation.");
  return r;
}

/** Messaging is scoped to one service request — there is no open-ended DM between strangers. */
export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  await sideOf(params.id, user.id);
  const messages = await db.message.findMany({ where: { requestId: params.id }, orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } });
  return NextResponse.json({ messages });
});

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const r = await sideOf(params.id, user.id);
  const parsed = messageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });

  // Blocked pairs (either direction) can't message each other about this or any other job.
  const otherId = user.id === r.customerId ? r.artisanId : r.customerId;
  const blocked = await db.block.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: otherId }, { blockerId: otherId, blockedId: user.id }] } });
  if (blocked) throw new HttpError(403, "You can't message this person.");

  const msg = await db.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { requestId: params.id, senderId: user.id, body: parsed.data.body } });
    await tx.notification.create({ data: { userId: otherId, type: "message.new", payload: { requestId: params.id } } });
    return m;
  });
  return NextResponse.json({ id: msg.id }, { status: 201 });
});
