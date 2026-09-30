import { NextResponse } from "next/server";
import { z } from "zod";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { decideVerification } from "@/server/services/verification.service";

const body = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), reason: z.string().max(300).optional() });
export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const p = body.safeParse(await req.json().catch(() => null));
  if (!p.success) throw new HttpError(422, "Invalid decision.");
  await decideVerification(admin.id, params.id, p.data.decision, p.data.reason);
  return NextResponse.json({ ok: true });
});
