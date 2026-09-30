import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";

const body = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "DEACTIVATED"]), reason: z.string().max(300).optional() });

/** Suspending/deactivating is immediate: currentUser() re-checks status on every request, so the
 *  affected person's next request (page load or API call) fails as unauthenticated right away. */
export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) throw new HttpError(422, "Invalid status.");
  if (params.id === admin.id) throw new HttpError(400, "You can't change your own account status here.");
  const target = await db.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!target) throw new HttpError(404, "User not found.");
  if (target.role === "ADMIN") throw new HttpError(403, "Admin accounts can't be suspended from this screen.");

  await db.$transaction(async (tx) => {
    await tx.user.update({ where: { id: params.id }, data: { status: p.data.status } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: `user.${p.data.status.toLowerCase()}`, entity: "User", entityId: params.id, meta: { reason: p.data.reason ?? null } } });
  });
  return NextResponse.json({ ok: true });
});
