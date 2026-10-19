import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { closeJob } from "@/server/services/jobs.service";

export const POST = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireRole("CUSTOMER");
  await closeJob(user.id, params.id);
  return NextResponse.json({ ok: true });
});
