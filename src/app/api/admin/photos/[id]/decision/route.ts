import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { decidePhoto } from "@/server/services/photo-moderation.service";

export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const b = (await req.json().catch(() => null)) as { decision?: unknown; reason?: unknown } | null;
  if (b?.decision !== "APPROVED" && b?.decision !== "REJECTED") throw new HttpError(422, "Invalid decision.");
  await decidePhoto(admin.id, params.id, b.decision, typeof b.reason === "string" ? b.reason : undefined);
  return NextResponse.json({ ok: true });
});
