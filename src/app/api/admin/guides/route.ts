import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { GuideFieldErrors, saveGuide } from "@/server/services/guides.service";

export const POST = handle(async (req) => {
  const admin = await requireRole("ADMIN");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const g = await saveGuide(admin.id, null, body ?? {});
    return NextResponse.json({ id: g.id, slug: g.slug }, { status: 201 });
  } catch (e) {
    if (e instanceof GuideFieldErrors) return NextResponse.json({ errors: e.errors }, { status: 422 });
    throw e;
  }
});
