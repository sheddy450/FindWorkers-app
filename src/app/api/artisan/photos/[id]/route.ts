import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { deletePhoto, updatePhoto } from "@/server/services/photos.service";

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireRole("ARTISAN");
  const b = await req.json().catch(() => ({})) as { caption?: unknown; categoryId?: unknown; isCover?: unknown };
  const photo = await updatePhoto(user.id, params.id, {
    caption: typeof b.caption === "string" ? b.caption : undefined,
    categoryId: typeof b.categoryId === "string" || b.categoryId === null ? (b.categoryId as string | null) : undefined,
    isCover: typeof b.isCover === "boolean" ? b.isCover : undefined,
  });
  return NextResponse.json(photo);
});

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireRole("ARTISAN");
  await deletePhoto(user.id, params.id);
  return NextResponse.json({ ok: true });
});
