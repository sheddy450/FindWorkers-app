import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { categorySchema, toSlug } from "@/lib/validation/category";

export const POST = handle(async (req) => {
  const admin = await requireRole("ADMIN");
  const p = categorySchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ errors: p.error.flatten().fieldErrors }, { status: 422 });
  const slug = toSlug(p.data.name);
  if (!slug) throw new HttpError(422, "Enter a name that has at least one letter or number.");
  if (await db.serviceCategory.findUnique({ where: { slug } })) throw new HttpError(409, "A category with this name already exists.");
  const cat = await db.$transaction(async (tx) => {
    const c = await tx.serviceCategory.create({ data: { name: p.data.name, slug } });
    await tx.auditLog.create({ data: { actorId: admin.id, action: "category.created", entity: "ServiceCategory", entityId: c.id } });
    return c;
  });
  return NextResponse.json(cat, { status: 201 });
});
