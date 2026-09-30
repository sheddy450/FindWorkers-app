import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { TRANSITIONS } from "@/lib/requests/rules";
import type { RequestStatus } from "@prisma/client";

const body = z.object({ to: z.string() });
export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) throw new HttpError(422, "Invalid status.");
  const to = p.data.to as RequestStatus;
  // REVIEWED must only happen through /review, which records the rating atomically with the transition.
  if (to === "REVIEWED") throw new HttpError(422, "Submit a review to mark this request reviewed.");

  const r = await db.serviceRequest.findUnique({ where: { id: params.id } });
  if (!r) throw new HttpError(404, "Request not found.");
  const side = user.id === r.customerId ? "CUSTOMER" : user.id === r.artisanId ? "ARTISAN" : null;
  if (!side) throw new HttpError(403, "This isn't your request.");
  const allowed = TRANSITIONS[r.status].find((t) => t.to === to && t.by === side);
  if (!allowed) throw new HttpError(409, "That change isn't allowed right now.");

  await db.$transaction(async (tx) => {
    const res = await tx.serviceRequest.updateMany({ where: { id: r.id, status: r.status }, data: { status: to } });
    if (res.count !== 1) throw new HttpError(409, "This request just changed. Refresh and try again.");
    await tx.requestStatusEvent.create({ data: { requestId: r.id, fromStatus: r.status, toStatus: to, actorId: user.id } });
    const notifyId = side === "CUSTOMER" ? r.artisanId : r.customerId;
    await tx.notification.create({ data: { userId: notifyId, type: "request.status", payload: { requestId: r.id, to } } });
    if (to === "COMPLETED") await tx.artisan.update({ where: { userId: r.artisanId }, data: { completedJobs: { increment: 1 } } });
  });
  return NextResponse.json({ ok: true });
});
