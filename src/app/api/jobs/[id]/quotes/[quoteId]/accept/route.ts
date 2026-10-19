import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { acceptQuote } from "@/server/services/jobs.service";

/** Hire the artisan behind this quote. Returns the new request's id. */
export const POST = handle(async (_req, { params }: { params: { id: string; quoteId: string } }) => {
  const user = await requireRole("CUSTOMER");
  const r = await acceptQuote(user.id, params.id, params.quoteId);
  return NextResponse.json(r);
});
