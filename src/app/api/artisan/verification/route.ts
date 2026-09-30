import { NextResponse } from "next/server";
import type { VerificationType } from "@prisma/client";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { submitVerification } from "@/server/services/verification.service";

export const POST = handle(async (req) => {
  const user = await requireRole("ARTISAN");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file"), type = form?.get("type");
  if (!(file instanceof File) || typeof type !== "string") throw new HttpError(422, "Choose a file to upload.");
  await submitVerification(user.id, type as VerificationType, Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true }, { status: 201 });
});
