import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { GuideFieldErrors, deleteGuide, saveGuide } from "@/server/services/guides.service";

export const PATCH = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const g = await saveGuide(admin.id, params.id, body ?? {});
    return NextResponse.json({ id: g.id, slug: g.slug });
  } catch (e) {
    if (e instanceof GuideFieldErrors) return NextResponse.json({ errors: e.errors }, { status: 422 });
    throw e;
  }
});

export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  await deleteGuide(admin.id, params.id);
  return NextResponse.json({ ok: true });
});
