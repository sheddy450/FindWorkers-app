import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { requestSchema } from "@/lib/validation/request";

export const POST = handle(async (req) => {
  const user = await requireRole("CUSTOMER");
  const url = new URL(req.url); const artisanId = url.searchParams.get("artisanId");
  if (!artisanId) throw new HttpError(422, "Missing artisan.");
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });
  const artisan = await db.artisan.findUnique({ where: { userId: artisanId }, select: { userId: true } });
  if (!artisan) throw new HttpError(404, "Artisan not found.");
  const v = parsed.data;
  // Photo keys must have been uploaded by this same customer (prefix check on the storage path).
  if (v.photoKeys.some((k) => !k.startsWith(`requests/${user.id}/`))) throw new HttpError(403, "One of the photos doesn't belong to you.");
  const created = await db.$transaction(async (tx) => {
    const r = await tx.serviceRequest.create({ data: {
      customerId: user.id, artisanId, categoryId: v.categoryId, description: v.description, address: v.address,
      preferredAt: v.preferredAt ? new Date(v.preferredAt) : null,
      photos: { create: v.photoKeys.map((k) => ({ storageKey: k })) },
    } });
    await tx.requestStatusEvent.create({ data: { requestId: r.id, toStatus: "REQUESTED", actorId: user.id } });
    await tx.notification.create({ data: { userId: artisanId, type: "request.new", payload: { requestId: r.id } } });
    return r;
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
});
