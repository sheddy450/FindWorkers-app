import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { messageSchema } from "@/lib/validation/message";

async function sideOf(conversationId: string, userId: string) {
  const c = await db.conversation.findUnique({ where: { id: conversationId }, select: { customerId: true, artisanId: true } });
  if (!c) throw new HttpError(404, "Conversation not found.");
  if (userId !== c.customerId && userId !== c.artisanId) throw new HttpError(403, "This isn't your conversation.");
  return c;
}

/** Same shape as /api/requests/[id]/messages, but for a pre-request inquiry thread. */
export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  await sideOf(params.id, user.id);
  const messages = await db.message.findMany({ where: { conversationId: params.id }, orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true } } } });
  return NextResponse.json({ messages });
});

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const c = await sideOf(params.id, user.id);
  const parsed = messageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });

  const otherId = user.id === c.customerId ? c.artisanId : c.customerId;
  const blocked = await db.block.findFirst({ where: { OR: [{ blockerId: user.id, blockedId: otherId }, { blockerId: otherId, blockedId: user.id }] } });
  if (blocked) throw new HttpError(403, "You can't message this person.");

  const msg = await db.$transaction(async (tx) => {
    const m = await tx.message.create({ data: { conversationId: params.id, senderId: user.id, body: parsed.data.body } });
    await tx.notification.create({ data: { userId: otherId, type: "message.new", payload: { conversationId: params.id } } });
    return m;
  });
  return NextResponse.json({ id: msg.id }, { status: 201 });
});
