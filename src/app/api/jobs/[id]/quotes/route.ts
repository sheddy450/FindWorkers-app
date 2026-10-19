import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { FieldErrors, sendQuote, withdrawQuote } from "@/server/services/jobs.service";

/** Send or update this artisan's quote. */
export const POST = handle(async (req, { params }: { params: { id: string } }) => {
  const user = await requireRole("ARTISAN");
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const q = await sendQuote(user.id, params.id, body ?? {});
    return NextResponse.json({ id: q.id });
  } catch (e) {
    if (e instanceof FieldErrors) return NextResponse.json({ errors: e.errors }, { status: 422 });
    throw e;
  }
});

/** Withdraw this artisan's quote. */
export const DELETE = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireRole("ARTISAN");
  await withdrawQuote(user.id, params.id);
  return NextResponse.json({ ok: true });
});
