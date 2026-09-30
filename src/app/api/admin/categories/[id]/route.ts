import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";

const body = z.object({ name: z.string().trim().min(2).max(60).optional(), isActive: z.boolean().optional() });

/** Renaming keeps the slug stable (search links and QR codes may reference it) — only the display name changes. */
export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success || (p.data.name === undefined && p.data.isActive === undefined)) throw new HttpError(422, "Nothing to update.");
  const cat = await db.serviceCategory.findUnique({ where: { id: params.id } });
  if (!cat) throw new HttpError(404, "Category not found.");
  const updated = await db.$transaction(async (tx) => {
    const c = await tx.serviceCategory.update({ where: { id: params.id }, data: { ...(p.data.name ? { name: p.data.name } : {}), ...(p.data.isActive !== undefined ? { isActive: p.data.isActive } : {}) } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "category.updated", entity: "ServiceCategory", entityId: c.id, meta: p.data } });
    return c;
  });
  return NextResponse.json(updated);
});
